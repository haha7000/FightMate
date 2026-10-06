// 카카오맵 JavaScript SDK 중 실제로 쓰는 부분만 타입 선언
export interface KLatLng {
  getLat(): number;
  getLng(): number;
}
export interface KMap {
  getCenter(): KLatLng;
  getBounds(): { getNorthEast(): KLatLng };
  setCenter(latlng: KLatLng): void;
  panTo(latlng: KLatLng): void;
  relayout(): void;
}
export interface KOverlay {
  setMap(map: KMap | null): void;
}
export interface KakaoMaps {
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
