import { CalendarDays, Clock, MapPin, Phone, Shirt } from "lucide-react";
import { isHandsFree, type Gym } from "@/lib/gyms";
import { dateParts, type GymEvent } from "@/lib/events";

// 운동복·수건 안내 문구
export function gearNote(gym: Gym): string {
  if (isHandsFree(gym)) return "운동복·수건 제공. 몸만 와도 돼요";
  if (gym.amenities.includes("운동복 대여")) return "운동복 대여 가능. 수건은 챙겨오세요";
  if (gym.amenities.includes("수건 제공")) return "수건 제공. 운동복은 챙겨오세요";
  return "운동복과 수건은 챙겨오세요";
}

// 카카오맵 길찾기 (좌표가 있으면 정확히, 없으면 주소 검색)
export function directionsUrl(gym: Gym): string {
  return gym.lat != null && gym.lng != null
    ? `https://map.kakao.com/link/to/${encodeURIComponent(gym.name)},${gym.lat},${gym.lng}`
    : `https://map.kakao.com/link/search/${encodeURIComponent(gym.address)}`;
}

// 체육관 상세의 정보 줄: 주소·길찾기 / 전화 / 운영시간 / 다음 일정 / 준비물
export function GymInfoRows({ gym, next }: { gym: Gym; next?: GymEvent }) {
  return (
    <ul className="mt-5 space-y-3 text-[14px]">
      <li className="flex gap-2.5">
        <MapPin size={18} className="mt-px shrink-0 text-muted" />
        <span>
          {gym.address}
          <a href={directionsUrl(gym)} target="_blank" rel="noopener noreferrer" className="ml-2 text-[13px] font-semibold text-brand">
            길찾기
          </a>
        </span>
      </li>
      {gym.phone && (
        <li className="flex gap-2.5">
          <Phone size={18} className="mt-px shrink-0 text-muted" />
          <a href={`tel:${gym.phone}`} className="font-semibold tabular-nums">
            {gym.phone}
          </a>
        </li>
      )}
      {gym.hours && (
        <li className="flex gap-2.5">
          <Clock size={18} className="mt-px shrink-0 text-muted" />
          <span className="whitespace-pre-line">{gym.hours}</span>
        </li>
      )}
      {next && (
        <li className="flex gap-2.5">
          <CalendarDays size={18} className="mt-px shrink-0 text-muted" />
          <span>
            다음 {next.kind}{" "}
            <b>
              {dateParts(next.date).m}/{dateParts(next.date).d}({dateParts(next.date).ko}) {next.startTime}
            </b>
          </span>
        </li>
      )}
      <li className="flex gap-2.5">
        <Shirt size={18} className="mt-px shrink-0 text-muted" />
        {gearNote(gym)}
      </li>
    </ul>
  );
}
