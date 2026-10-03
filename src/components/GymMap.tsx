"use client";

import Script from "next/script";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DISCIPLINES, formatPrice, offersDayPass, type Discipline, type Gym } from "@/lib/gyms";
import { distanceM, formatDistance, type Place } from "@/lib/places";

// ── 카카오맵 SDK 중 실제로 쓰는 부분만 타입 선언 ──────────────
interface KLatLng {
  getLat(): number;
  getLng(): number;
}
interface KMap {
  getCenter(): KLatLng;
  getBounds(): { getNorthEast(): KLatLng };
  setCenter(latlng: KLatLng): void;
  panTo(latlng: KLatLng): void;
  relayout(): void;
}
interface KOverlay {
  setMap(map: KMap | null): void;
}
interface KakaoMaps {
  load(callback: () => void): void;
  LatLng: new (lat: number, lng: number) => KLatLng;
  Map: new (el: HTMLElement, opts: { center: KLatLng; level: number }) => KMap;
  CustomOverlay: new (opts: {
    position: KLatLng;
    content: HTMLElement;
    yAnchor?: number;
    zIndex?: number;
    clickable?: boolean;
  }) => KOverlay;
  event: { addListener(target: KMap, type: string, handler: () => void): void };
}
declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
const DEFAULT_CENTER = { lat: 37.4979, lng: 127.0276 }; // 강남역 (위치 권한 없을 때)
const DEFAULT_LEVEL = 5; // 반경 약 1~2km가 한 화면
const MAX_RADIUS_M = 20000; // 카카오 검색 반경 상한
const REQUESTED_KEY = "fm_gym_requests"; // 이 기기에서 입점 요청한 장소 ID

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
    <div className="fixed inset-x-0 top-0 bottom-14 flex flex-col md:top-14 md:bottom-0">
      {KAKAO_JS_KEY && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`}
          onReady={() => window.kakao?.maps.load(() => setSdkReady(true))}
          onError={() => setSdkError(true)}
        />
      )}

      {/* 지도 영역 */}
      <div className="relative min-h-0 flex-1">
        <div ref={mapEl} className="h-full w-full bg-neutral-100" />

        {sdkError && <SdkErrorView />}

        {/* 종목 필터 */}
        <div className="absolute inset-x-0 top-0 z-10 flex gap-2 overflow-x-auto px-3 pt-3 pb-2">
          <Chip
            label="🎟️ 1일권"
            active={dayPassOnly}
            onClick={() => {
              setDayPassOnly((v) => !v);
              setSelected(null);
            }}
          />
          <Chip label="전체" active={discipline === null} onClick={() => pickDiscipline(null)} />
          {DISCIPLINES.map((d) => (
            <Chip key={d} label={d} active={discipline === d} onClick={() => pickDiscipline(d)} />
          ))}
        </div>

        {/* 이 지역 재검색 */}
        {moved && !loading && (
          <button
            onClick={() => search()}
            className="absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-bold text-white shadow-lg active:bg-neutral-700"
          >
            ↻ 이 지역에서 재검색
          </button>
        )}
        {loading && (
          <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-600 shadow-lg">
            체육관 찾는 중…
          </div>
        )}

        {/* 내 위치 */}
        <button
          onClick={() => locate(false)}
          aria-label="내 위치로 이동"
          className="absolute bottom-4 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg shadow-lg active:bg-neutral-100"
        >
          ◎
        </button>
      </div>

      {/* 하단 패널: 선택한 체육관 / 목록 / 요약 */}
      <div className="max-h-[55%] overflow-y-auto border-t border-neutral-200 bg-white">
        {notice && !selected && !listOpen && (
          <p className="bg-orange-50 px-4 py-2 text-xs text-orange-700">{notice}</p>
        )}

        {selected?.kind === "gym" && (
          <GymSheet gym={selected.gym} distance={dist(selected.gym.lat, selected.gym.lng)} onClose={() => setSelected(null)} />
        )}
        {selected?.kind === "place" && (
          <PlaceSheet key={selected.place.id} place={selected.place} distance={dist(selected.place.lat, selected.place.lng)} onClose={() => setSelected(null)} />
        )}

        {!selected && listOpen && (
          <div>
            <div className="sticky top-0 flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-3">
              <p className="text-sm font-bold">목록 {listItems.length}곳</p>
              <button onClick={() => setListOpen(false)} className="text-sm text-neutral-500">
                지도 보기
              </button>
            </div>
            <ul>
              {listItems.map((item) => (
                <li key={item.kind === "gym" ? `g-${item.gym.id}` : `p-${item.place.id}`}>
                  <button
                    onClick={() => focus(item.kind === "gym" ? { kind: "gym", gym: item.gym } : { kind: "place", place: item.place })}
                    className="flex w-full items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 text-left active:bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {item.kind === "gym" && <span className="mr-1 text-orange-500">●</span>}
                        {item.kind === "gym" ? item.gym.name : item.place.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-neutral-500">
                        {item.kind === "gym"
                          ? `체험 ${formatPrice(item.gym.trialPrice)} · ${
                              offersDayPass(item.gym) ? `1일권 ${formatPrice(item.gym.dayPassPrice!)}` : "1일권 없음"
                            }`
                          : item.place.disciplines.join(" · ") || item.place.category}
                      </p>
                    </div>
                    {origin && <span className="shrink-0 text-xs text-neutral-400">{formatDistance(item.m)}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!selected && !listOpen && (
          <div className="flex items-center justify-between px-4 py-3">
            {error ? (
              <p className="text-sm text-orange-600">
                {error}{" "}
                <button onClick={() => search()} className="font-bold underline">
                  다시 시도
                </button>
              </p>
            ) : (
              <p className="text-sm text-neutral-600">
                {dayPassOnly ? "1일권 가능" : "주변 체육관"}{" "}
                <b className="text-neutral-900">{partnerGyms.length + otherPlaces.length}</b>곳
                {dayPassOnly ? (
                  <span className="text-neutral-400"> · FightMate 입점 체육관 기준</span>
                ) : (
                  partnerGyms.length > 0 && (
                    <span className="text-orange-600"> · 바로 예약 {partnerGyms.length}곳</span>
                  )
                )}
              </p>
            )}
            <button
              onClick={() => setListOpen(true)}
              className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700"
            >
              목록
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 지도 핀 (카카오 오버레이는 React 밖 DOM이라 직접 만든다) ─────────
// 이름은 외부(카카오) 데이터이므로 innerHTML 대신 textContent로만 넣는다.

// 이름 말풍선 핀: 입점 체육관(주황) 또는 선택된 미입점 장소(검정)
function pill(name: string, kind: "partner" | "place", selected = false): HTMLElement {
  const wrap = document.createElement("button");
  wrap.type = "button";
  wrap.className = "flex flex-col items-center";
  const label = document.createElement("span");
  const tail = document.createElement("span");
  if (kind === "partner") {
    label.className = `max-w-40 truncate rounded-full bg-orange-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg ring-2 ${
      selected ? "ring-neutral-900" : "ring-white"
    }`;
    tail.className = "-mt-1 h-2 w-2 rotate-45 bg-orange-500";
  } else {
    label.className =
      "max-w-40 truncate rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-bold text-white shadow-lg ring-2 ring-white";
    tail.className = "-mt-1 h-2 w-2 rotate-45 bg-neutral-900";
  }
  label.textContent = kind === "partner" ? `🥊 ${name}` : name;
  wrap.append(label, tail);
  return wrap;
}

// 미입점 장소: 작은 점 (수십 개가 겹쳐도 지도가 덜 지저분하도록)
function dot(): HTMLElement {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", "체육관");
  el.className = "block h-4 w-4 rounded-full bg-neutral-700 shadow ring-2 ring-white";
  return el;
}

function myDot(): HTMLElement {
  const el = document.createElement("span");
  el.className = "block h-4 w-4 rounded-full bg-blue-500 ring-4 ring-blue-500/25";
  return el;
}

// ── 하단 패널 ─────────────────────────────────────────

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium shadow-md ${
        active ? "bg-orange-500 text-white" : "bg-white text-neutral-700"
      }`}
    >
      {label}
    </button>
  );
}

function SheetHeader({ title, sub, onClose }: { title: string; sub: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-lg font-extrabold">{title}</h2>
        <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>
      </div>
      <button onClick={onClose} aria-label="닫기" className="shrink-0 px-1 text-xl text-neutral-400">
        ✕
      </button>
    </div>
  );
}

function Tags({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((d) => (
        <span key={d} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
          {d}
        </span>
      ))}
    </div>
  );
}

// 입점 체육관: 우리 상세페이지·체험 신청으로 연결
function GymSheet({ gym, distance, onClose }: { gym: Gym; distance: number | null; onClose: () => void }) {
  return (
    <div className="p-4">
      <p className="mb-2 inline-block rounded-md bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-700">
        FightMate 입점 · 전화 없이 바로 예약
      </p>
      <SheetHeader
        title={gym.name}
        sub={[distance != null && formatDistance(distance), gym.district, `⭐ ${gym.rating}`].filter(Boolean).join(" · ")}
        onClose={onClose}
      />
      <Tags items={gym.disciplines} />
      <p className="mt-3 text-sm text-neutral-600">
        체험 {formatPrice(gym.trialPrice)}
        <span className="mx-1.5 text-neutral-300">|</span>
        {offersDayPass(gym) ? (
          <b className="text-neutral-900">1일권 {formatPrice(gym.dayPassPrice!)}</b>
        ) : (
          <span className="text-neutral-400">1일권 없음</span>
        )}
      </p>
      <div className="mt-4 flex gap-2">
        <Link href={`/gym/${gym.id}`} className="flex-1 rounded-xl border border-neutral-200 py-3 text-center text-sm font-bold">
          상세보기
        </Link>
        <Link
          href={`/gym/${gym.id}/apply`}
          className="flex-[2] rounded-xl bg-orange-500 py-3 text-center text-sm font-bold text-white active:bg-orange-600"
        >
          체험 신청 · {formatPrice(gym.trialPrice)}
        </Link>
      </div>
    </div>
  );
}

function readRequested(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(REQUESTED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

// 미입점 장소: 카카오 정보 + 입점 요청
function PlaceSheet({ place, distance, onClose }: { place: Place; distance: number | null; onClose: () => void }) {
  // 장소마다 key로 새로 마운트되므로 초기값만 읽으면 된다 (선택 후에만 렌더 → 서버 렌더 없음)
  const [requested, setRequested] = useState(() => readRequested().includes(place.id));
  const [sending, setSending] = useState(false);

  async function requestPartner() {
    setSending(true);
    await fetch("/api/gym-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: place.id, name: place.name, address: place.address, phone: place.phone }),
    }).catch(() => null);
    try {
      window.localStorage.setItem(REQUESTED_KEY, JSON.stringify([...new Set([...readRequested(), place.id])]));
    } catch {
      // 저장 실패해도 요청 자체는 전송됨
    }
    setSending(false);
    setRequested(true);
  }

  const directions = `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.lat},${place.lng}`;

  return (
    <div className="p-4">
      <SheetHeader
        title={place.name}
        sub={[distance != null && formatDistance(distance), place.category].filter(Boolean).join(" · ")}
        onClose={onClose}
      />
      <p className="mt-2 text-sm text-neutral-600">{place.address}</p>
      <Tags items={place.disciplines} />

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm font-medium">
        {place.phone ? (
          <a href={`tel:${place.phone}`} className="rounded-xl bg-neutral-100 py-2.5">
            📞 전화
          </a>
        ) : (
          <span className="rounded-xl bg-neutral-50 py-2.5 text-neutral-300">📞 전화</span>
        )}
        <a href={directions} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-neutral-100 py-2.5">
          🧭 길찾기
        </a>
        <a href={place.url} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-neutral-100 py-2.5">
          카카오맵
        </a>
      </div>

      <button
        onClick={requestPartner}
        disabled={requested || sending}
        className="mt-3 w-full rounded-xl border border-orange-300 bg-orange-50 py-3 text-sm font-bold text-orange-700 disabled:opacity-70"
      >
        {requested ? "✓ 입점 요청 완료 — 관장님께 전해드릴게요" : sending ? "요청 중…" : "🙋 여기도 전화 없이 예약하고 싶어요 (입점 요청)"}
      </button>
    </div>
  );
}

function SdkErrorView() {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-50 p-6 text-center">
      <div>
        <p className="text-3xl">🗺️</p>
        <p className="mt-3 font-bold">지도를 불러오지 못했어요</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          {KAKAO_JS_KEY ? (
            <>
              카카오 개발자 콘솔 → 플랫폼 → Web 사이트 도메인에
              <br />
              <code className="rounded bg-neutral-200 px-1.5 py-0.5 text-neutral-800">{origin}</code>
              <br />이 등록돼 있는지 확인해주세요.
            </>
          ) : (
            "NEXT_PUBLIC_KAKAO_JS_KEY가 설정되지 않았어요."
          )}
        </p>
      </div>
    </div>
  );
}
