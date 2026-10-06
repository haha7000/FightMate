// Supabase DB 타입 — supabase/schema.sql + 마이그레이션(2026-09-30 ~ 2026-10-09) 기준으로 직접 작성.
// `supabase gen types typescript` 출력과 같은 모양이라, 나중에 CLI로 생성한 파일로 그대로 교체할 수 있다.
// 컬럼을 추가·변경하면 여기도 함께 고친다 (안 고치면 타입 검사에서 바로 드러난다).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type GymFk<Name extends string, OneToOne extends boolean = false> = {
  foreignKeyName: Name;
  columns: ["gym_id"];
  isOneToOne: OneToOne;
  referencedRelation: "gyms";
  referencedColumns: ["id"];
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      gyms: {
        Row: {
          id: string;
          name: string;
          disciplines: string[];
          district: string;
          address: string;
          intro: string;
          trial_price: number;
          day_pass_price: number | null; // null = 1일권 미운영
          monthly_price: number | null;
          rating: number;
          review_count: number;
          emoji: string;
          amenities: string[];
          photos: Json; // [{ src, caption }]
          owner_id: string | null; // 예전 방식 (권한은 gym_members)
          lat: number | null;
          lng: number | null;
          kakao_place_id: string | null;
          phone: string | null; // 체육관 대표 번호 (공개)
          hours: string | null; // 운영시간 (자유 입력)
          timetable_url: string | null; // 수업 시간표 이미지
          is_published: boolean; // false = 운영자가 숨김
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          district: string;
          address: string;
          disciplines?: string[];
          intro?: string;
          trial_price?: number;
          day_pass_price?: number | null;
          monthly_price?: number | null;
          rating?: number;
          review_count?: number;
          emoji?: string;
          amenities?: string[];
          photos?: Json;
          owner_id?: string | null;
          lat?: number | null;
          lng?: number | null;
          kakao_place_id?: string | null;
          phone?: string | null;
          hours?: string | null;
          timetable_url?: string | null;
          is_published?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["gyms"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          nickname: string | null;
          discipline: string | null;
          weight_class: string | null;
          gym_name: string | null;
          years: string | null;
          belt: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname?: string | null;
          discipline?: string | null;
          weight_class?: string | null;
          gym_name?: string | null;
          years?: string | null;
          belt?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string | null;
          gym_id: string;
          gym_name: string;
          name: string;
          phone: string;
          date: string;
          type: string; // '체험' | '1일권'
          status: string; // '신청됨' | '확정' | '거절' | '사용 완료' | '취소'
          status_changed_at: string | null;
          preferred_time: string | null; // 오전 | 오후 | 저녁 | 상관없음
          note: string | null; // 요청사항
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          gym_id: string;
          gym_name: string;
          name: string;
          phone: string;
          date: string;
          type?: string;
          status?: string;
          status_changed_at?: string | null;
          preferred_time?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
        Relationships: [GymFk<"bookings_gym_id_fkey">];
      };
      reviews: {
        Row: {
          id: string;
          gym_id: string;
          user_id: string | null;
          author: string;
          rating: number;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          user_id?: string | null;
          author?: string;
          rating: number;
          text: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
        Relationships: [GymFk<"reviews_gym_id_fkey">];
      };
      events: {
        Row: {
          id: string;
          gym_id: string;
          gym_name: string;
          kind: string; // EventKind
          title: string;
          date: string;
          start_time: string;
          fee: number;
          capacity: number | null;
          attendees: number; // 시드 베이스라인
          rsvp_count: number; // 실제 신청 수 (트리거 집계)
          description: string;
          poster_url: string | null;
          open_to_visitors: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          gym_id: string;
          gym_name: string;
          kind?: string;
          title: string;
          date: string;
          start_time?: string;
          fee?: number;
          capacity?: number | null;
          attendees?: number;
          rsvp_count?: number;
          description?: string;
          poster_url?: string | null;
          open_to_visitors?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [GymFk<"events_gym_id_fkey">];
      };
      event_rsvps: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          name: string;
          phone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          name?: string;
          phone?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_rsvps"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      gym_requests: {
        Row: {
          id: string;
          kakao_place_id: string;
          name: string;
          address: string;
          phone: string;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          kakao_place_id: string;
          name: string;
          address?: string;
          phone?: string;
          user_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["gym_requests"]["Insert"]>;
        Relationships: [];
      };
      admins: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["admins"]["Insert"]>;
        Relationships: [];
      };
      gym_members: {
        Row: { gym_id: string; user_id: string; role: string; created_at: string };
        Insert: { gym_id: string; user_id: string; role?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["gym_members"]["Insert"]>;
        Relationships: [GymFk<"gym_members_gym_id_fkey">];
      };
      gym_invites: {
        Row: {
          token: string;
          gym_id: string;
          role: string;
          created_by: string | null;
          expires_at: string;
          used_by: string | null;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          token?: string;
          gym_id: string;
          role?: string;
          created_by?: string | null;
          expires_at?: string;
          used_by?: string | null;
          used_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["gym_invites"]["Insert"]>;
        Relationships: [GymFk<"gym_invites_gym_id_fkey">];
      };
      partner_applications: {
        Row: {
          id: string;
          gym_name: string;
          address: string;
          owner_name: string;
          phone: string;
          message: string;
          user_id: string | null;
          status: string; // '새 신청' | '처리 완료'
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_name: string;
          address?: string;
          owner_name: string;
          phone: string;
          message?: string;
          user_id?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["partner_applications"]["Insert"]>;
        Relationships: [];
      };
      gym_notify: {
        Row: { gym_id: string; phone: string; enabled: boolean; updated_at: string };
        Insert: { gym_id: string; phone: string; enabled?: boolean; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["gym_notify"]["Insert"]>;
        Relationships: [GymFk<"gym_notify_gym_id_fkey", true>];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
      is_gym_member: { Args: { gid: string }; Returns: boolean };
      peek_gym_invite: {
        Args: { invite_token: string };
        Returns: { gym_id: string; gym_name: string; role: string; expired: boolean; used: boolean }[];
      };
      redeem_gym_invite: { Args: { invite_token: string }; Returns: string };
      cancel_my_booking: { Args: { bid: string }; Returns: undefined };
      delete_my_account: { Args: never; Returns: undefined };
      booking_notify_targets: {
        Args: { bid: string };
        Returns: {
          phone: string;
          gym_id: string;
          gym_name: string;
          applicant: string;
          visit_date: string;
          kind: string;
        }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicTables = Database["public"]["Tables"];
export type Tables<T extends keyof PublicTables> = PublicTables[T]["Row"];
export type TablesInsert<T extends keyof PublicTables> = PublicTables[T]["Insert"];
