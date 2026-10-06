"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type Review } from "@/lib/store";
import { fetchCanReview, fetchReviews, submitReview } from "@/lib/data.client";

export default function ReviewSection({ gymId }: { gymId: string }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  // 리뷰는 로그인한 회원만 (DB 정책도 본인 명의만 허용)
  const needsLogin = isSupabaseConfigured && !loading && !user;
  const [canReview, setCanReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [writing, setWriting] = useState(false);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  useEffect(() => {
    fetchReviews(gymId).then(setReviews);
  }, [gymId]);

  // 로그인한 회원이 이 체육관 방문을 마쳤는지 (리뷰 작성 자격)
  useEffect(() => {
    if (loading) return;
    fetchCanReview(gymId).then(setCanReview);
  }, [gymId, loading, user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // TODO(M2): 예약 이력 있는 유저만 작성 가능하게 제한
    setSaving(true);
    setError(null);
    const res = await submitReview({ gymId, author: author.trim() || user?.name || "익명", rating, text: text.trim() });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setReviews(await fetchReviews(gymId));
    setWriting(false);
    setAuthor("");
    setRating(5);
    setText("");
  }

  return (
    <section className="mt-2 bg-white px-4 py-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold">
          리뷰 <span className="text-muted">{reviews.length}</span>
        </h2>
        {needsLogin ? (
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="text-[14px] font-semibold text-brand">
            로그인하고 리뷰 쓰기
          </Link>
        ) : canReview ? (
          <button onClick={() => setWriting((v) => !v)} className="text-[14px] font-semibold text-brand">
            {writing ? "취소" : "리뷰 쓰기"}
          </button>
        ) : (
          !loading && <span className="text-[12px] text-muted">방문 후 리뷰를 쓸 수 있어요</span>
        )}
      </div>

      {writing && (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-3 rounded-xl border border-line p-4">
          <div className="flex gap-1" role="radiogroup" aria-label="별점">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={n === rating}
                aria-label={`${n}점`}
                onClick={() => setRating(n)}
                className="p-0.5"
              >
                <Star size={26} className={n <= rating ? "fill-star stroke-star" : "stroke-line"} />
              </button>
            ))}
          </div>
          <input
            className="input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder={user?.name ? `닉네임 (비우면 ${user.name})` : "닉네임 (선택)"}
          />
          <textarea
            className="input min-h-24 resize-none"
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="체험은 어땠나요? 시설, 분위기, 코칭 스타일을 알려주세요."
          />
          {error && <p className="text-[13px] text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand py-3 text-[15px] font-bold text-white disabled:opacity-50"
          >
            {saving ? "등록 중…" : "등록"}
          </button>
        </form>
      )}

      <ul className="mt-2 divide-y divide-line">
        {reviews.map((r) => (
          <li key={r.id} className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold">{r.author}</p>
              <p className="text-[12px] text-muted">{r.date}</p>
            </div>
            <p className="mt-1 flex gap-0.5" aria-label={`${r.rating}점`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={13} className={n <= r.rating ? "fill-star stroke-star" : "stroke-line"} />
              ))}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink/80">{r.text}</p>
          </li>
        ))}
      </ul>
      {reviews.length === 0 && !writing && (
        <p className="py-6 text-center text-[14px] text-muted">아직 리뷰가 없어요. 첫 리뷰를 남겨주세요.</p>
      )}
    </section>
  );
}
