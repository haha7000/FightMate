"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, RotateCw, Ticket } from "lucide-react";
import { DISCIPLINES, offersDayPass, type Discipline, type Gym } from "@/lib/gyms";
import { MAX_RADIUS_M, distanceM, formatDistance, type Place } from "@/lib/places";
import { formatWon } from "@/lib/format";
import { Chip } from "@/components/ui/Chip";
import type { KMap, KOverlay } from "./kakao";
import { dot, myDot, pill } from "./pins";
import { GymSheet, PlaceSheet, SdkErrorView } from "./sheets";

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
const DEFAULT_CENTER = { lat: 37.4979, lng: 127.0276 }; // 강남역 (위치 권한 없을 때)
const DEFAULT_LEVEL = 5; // 반경 약 1~2km가 한 화면

type LatLng = { lat: number; lng: number };
type Selected = { kind: "gym"; gym: Gym } | { kind: "place"; place: Place } | null;

export default function GymMap({ gyms }: { gyms: Gym[] }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KMap | null>(null);
  const overlaysRef = useRef<KOverlay[]>([]);
  const searchSeq = useRef(0); // 느린 이전 응답이 최신 결과를 덮지 않도록
  const disciplineRef = useRef<Discipline | null>(null);

  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(!KAKAO_JS_KEY);
  const [places, setPlaces] = useState<Place[]>([]);
  const [searchCenter, setSearchCenter] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moved, setMoved] = useState(false);
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [dayPassOnly, setDayPassOnly] = useState(false);
  const [selected, setSelected] = useState<Selected>(null);
  const [listOpen, setListOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [myPos, setMyPos] = useState<LatLng | null>(null);

  // 현재 지도 화면 영역을 검색 (반경 = 중심 → 모서리 거리)
  const search = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    const ne = map.getBounds().getNorthEast();
    const lat = c.getLat();
    const lng = c.getLng();
    const radius = Math.min(distanceM(lat, lng, ne.getLat(), ne.getLng()), MAX_RADIUS_M);

    const seq = ++searchSeq.current;
    setLoading(true);
    setError(null);
    setMoved(false);
    try {
      const params = new URLSearchParams({
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        radius: String(Math.round(radius)),
      });
      if (disciplineRef.current) params.set("d", disciplineRef.current);
      const res = await fetch(`/api/places?${params}`);
      const body = (await res.json()) as { places?: Place[]; error?: string };
      if (seq !== searchSeq.current) return;
      if (!res.ok || !body.places) throw new Error(body.error);
      setPlaces(body.places);
      setSearchCenter({ lat, lng });
    } catch (e) {
      if (seq !== searchSeq.current) return;
      setError(e instanceof Error && e.message ? e.message : "검색에 실패했어요");
    } finally {
      if (seq === searchSeq.current) setLoading(false);
    }
  }, []);

  // 내 위치로 이동. 브라우저는 HTTPS(보안 컨텍스트)에서만 위치를 준다.
  const locate = useCallback(
    (initial: boolean) => {
      const maps = window.kakao?.maps;
      const map = mapRef.current;
      if (!maps || !map) return;

      const fail = (message: string) => {
        setNotice(message);
        if (initial) search();
      };
      if (!window.isSecureContext || !navigator.geolocation) {
        fail("내 위치는 HTTPS 접속에서만 쓸 수 있어요. 강남역 기준으로 보여드려요.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMyPos(here);
          setNotice(null);
          const latlng = new maps.LatLng(here.lat, here.lng);
          if (initial) map.setCenter(latlng);
          else map.panTo(latlng);
          search();
        },
        () => fail("위치 권한이 없어 강남역 기준으로 보여드려요."),
        { timeout: 8000, maximumAge: 60_000 }
      );
    },
    [search]
  );

  // SDK 준비되면 지도 생성 → 내 위치(또는 기본 위치)에서 첫 검색
  useEffect(() => {
    const maps = window.kakao?.maps;
    if (!sdkReady || !maps || !mapEl.current || mapRef.current) return;

    const map = new maps.Map(mapEl.current, {
      center: new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
      level: DEFAULT_LEVEL,
    });
    mapRef.current = map;
    maps.event.addListener(map, "dragend", () => setMoved(true));
    maps.event.addListener(map, "zoom_changed", () => setMoved(true));
    maps.event.addListener(map, "click", () => setSelected(null));

    // 하단 패널이 커지고 작아질 때 지도 크기 재계산
    const ro = new ResizeObserver(() => map.relayout());
    ro.observe(mapEl.current);

    locate(true);
    return () => ro.disconnect();
  }, [sdkReady, locate]);

  // 입점 체육관 중 좌표가 있고 현재 종목 필터에 맞는 곳
  const partnerGyms = useMemo(
    () =>
      gyms.filter(
        (g) =>
          g.lat != null &&
          g.lng != null &&
          (!discipline || g.disciplines.includes(discipline)) &&
          (!dayPassOnly || offersDayPass(g))
      ),
    [gyms, discipline, dayPassOnly]
  );
  // 카카오 결과 중 이미 입점한 곳은 입점 핀으로만 보여준다.
  // 1일권 정보는 입점 체육관에만 있으므로 1일권 필터 중엔 카카오 결과를 숨긴다.
  const otherPlaces = useMemo(() => {
    if (dayPassOnly) return [];
    const partnerIds = new Set(gyms.map((g) => g.kakaoPlaceId).filter(Boolean));
    return places.filter((p) => !partnerIds.has(p.id));
  }, [gyms, places, dayPassOnly]);

  // 핀 다시 그리기
  useEffect(() => {
    const maps = window.kakao?.maps;
    const map = mapRef.current;
    if (!sdkReady || !maps || !map) return;

    overlaysRef.current.forEach((o) => o.setMap(null));
    const overlays: KOverlay[] = [];
    const add = (lat: number, lng: number, content: HTMLElement, yAnchor: number, zIndex: number) => {
      const o = new maps.CustomOverlay({
        position: new maps.LatLng(lat, lng),
        content,
        yAnchor,
        zIndex,
        clickable: true,
      });
      o.setMap(map);
      overlays.push(o);
    };

    for (const place of otherPlaces) {
      const isSel = selected?.kind === "place" && selected.place.id === place.id;
      const el = isSel ? pill(place.name, "place", true) : dot();
      el.addEventListener("click", () => {
        setSelected({ kind: "place", place });
        setListOpen(false);
      });
      add(place.lat, place.lng, el, isSel ? 1 : 0.5, isSel ? 30 : 1);
    }
    for (const gym of partnerGyms) {
      const isSel = selected?.kind === "gym" && selected.gym.id === gym.id;
      const el = pill(gym.name, "partner", isSel);
      el.addEventListener("click", () => {
        setSelected({ kind: "gym", gym });
        setListOpen(false);
      });
      add(gym.lat!, gym.lng!, el, 1, isSel ? 40 : 20);
    }
    if (myPos) add(myPos.lat, myPos.lng, myDot(), 0.5, 50);

    overlaysRef.current = overlays;
  }, [sdkReady, otherPlaces, partnerGyms, selected, myPos]);

  function pickDiscipline(d: Discipline | null) {
    disciplineRef.current = d;
    setDiscipline(d);
    setSelected(null);
    search();
  }

  function focus(next: Exclude<Selected, null>) {
    const maps = window.kakao?.maps;
    const pos = next.kind === "gym" ? next.gym : next.place;
    if (maps && mapRef.current && pos.lat != null && pos.lng != null) {
      mapRef.current.panTo(new maps.LatLng(pos.lat, pos.lng));
    }
    setSelected(next);
    setListOpen(false);
  }

  const origin = myPos ?? searchCenter;
  const dist = (lat: number | null, lng: number | null) =>
    origin && lat != null && lng != null ? distanceM(origin.lat, origin.lng, lat, lng) : null;

  // 목록: 입점 체육관 먼저, 그다음 가까운 순
  const listItems = useMemo(() => {
    const d = (lat: number, lng: number) =>
      origin ? distanceM(origin.lat, origin.lng, lat, lng) : 0;
    return [
      ...partnerGyms
        .map((gym) => ({ kind: "gym" as const, gym, m: d(gym.lat!, gym.lng!) }))
        .sort((a, b) => a.m - b.m),
      ...otherPlaces
        .map((place) => ({ kind: "place" as const, place, m: d(place.lat, place.lng) }))
        .sort((a, b) => a.m - b.m),
    ];
  }, [partnerGyms, otherPlaces, origin]);

  return (
    <div className="fixed top-0 left-1/2 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] flex w-full max-w-[480px] -translate-x-1/2 flex-col">
      {KAKAO_JS_KEY && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`}
          onReady={() => window.kakao?.maps.load(() => setSdkReady(true))}
          onError={() => setSdkError(true)}
        />
      )}

      {/* 지도 영역 */}
      <div className="relative min-h-0 flex-1">
        <div ref={mapEl} className="h-full w-full bg-field" />

        {sdkError && <SdkErrorView />}

        {/* 종목 필터 */}
        <div className="no-scrollbar absolute inset-x-0 top-0 z-10 flex gap-1.5 overflow-x-auto px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2">
          <Chip
            tone="floating"
            active={dayPassOnly}
            onClick={() => {
              setDayPassOnly((v) => !v);
              setSelected(null);
            }}
          >
            <Ticket size={14} strokeWidth={2} />
            1일권 가능
          </Chip>
          <Chip tone="floating" active={discipline === null} onClick={() => pickDiscipline(null)}>
            전체
          </Chip>
          {DISCIPLINES.map((d) => (
            <Chip key={d} tone="floating" active={discipline === d} onClick={() => pickDiscipline(d)}>
              {d}
            </Chip>
          ))}
        </div>

        {/* 이 지역 재검색 */}
        {moved && !loading && (
          <button
            onClick={() => search()}
            className="absolute left-1/2 top-16 z-10 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[14px] font-bold text-white shadow-lg"
          >
            <RotateCw size={15} strokeWidth={2.5} />
            이 지역에서 재검색
          </button>
        )}
        {loading && (
          <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-[14px] font-medium text-muted shadow-lg">
            체육관 찾는 중…
          </div>
        )}

        {/* 내 위치 */}
        <button
          onClick={() => locate(false)}
          aria-label="내 위치로 이동"
          className="absolute bottom-4 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg active:bg-field"
        >
          <LocateFixed size={20} />
        </button>
      </div>

      {/* 하단 패널: 선택한 체육관 / 목록 / 요약 */}
      <div className="max-h-[55%] overflow-y-auto border-t border-line bg-white">
        {notice && !selected && !listOpen && (
          <p className="bg-field px-4 py-2 text-[12px] text-muted">{notice}</p>
        )}

        {selected?.kind === "gym" && (
          <GymSheet gym={selected.gym} distance={dist(selected.gym.lat, selected.gym.lng)} onClose={() => setSelected(null)} />
        )}
        {selected?.kind === "place" && (
          <PlaceSheet key={selected.place.id} place={selected.place} distance={dist(selected.place.lat, selected.place.lng)} onClose={() => setSelected(null)} />
        )}

        {!selected && listOpen && (
          <div>
            <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-4 py-3">
              <p className="text-sm font-bold">목록 {listItems.length}곳</p>
              <button onClick={() => setListOpen(false)} className="text-[14px] text-muted">
                지도 보기
              </button>
            </div>
            <ul>
              {listItems.map((item) => (
                <li key={item.kind === "gym" ? `g-${item.gym.id}` : `p-${item.place.id}`}>
                  <button
                    onClick={() => focus(item.kind === "gym" ? { kind: "gym", gym: item.gym } : { kind: "place", place: item.place })}
                    className="flex w-full items-center justify-between gap-3 border-b border-line px-4 py-3 text-left active:bg-field"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {item.kind === "gym" && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-brand align-middle" />}
                        {item.kind === "gym" ? item.gym.name : item.place.name}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-muted">
                        {item.kind === "gym"
                          ? `체험 ${formatWon(item.gym.trialPrice)} · ${
                              offersDayPass(item.gym) ? `1일권 ${formatWon(item.gym.dayPassPrice!)}` : "1일권 없음"
                            }`
                          : item.place.disciplines.join(" · ") || item.place.category}
                      </p>
                    </div>
                    {origin && <span className="shrink-0 text-[12px] text-muted tabular-nums">{formatDistance(item.m)}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!selected && !listOpen && (
          <div className="flex items-center justify-between px-4 py-3">
            {error ? (
              <p className="text-[14px] text-red-600">
                {error}{" "}
                <button onClick={() => search()} className="font-bold underline">
                  다시 시도
                </button>
              </p>
            ) : (
              <p className="text-[14px] text-muted">
                {dayPassOnly ? "1일권 가능" : "주변 체육관"}{" "}
                <b className="text-ink">{partnerGyms.length + otherPlaces.length}</b>곳
                {dayPassOnly ? (
                  <span> · FightMate 입점 체육관 기준</span>
                ) : (
                  partnerGyms.length > 0 && (
                    <span className="font-semibold text-brand"> · 바로 예약 {partnerGyms.length}곳</span>
                  )
                )}
              </p>
            )}
            <button
              onClick={() => setListOpen(true)}
              className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium"
            >
              목록
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

