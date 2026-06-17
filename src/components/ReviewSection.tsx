"use client";

import { useEffect, useState } from "react";
import { type Review } from "@/lib/store";
import { fetchReviews, submitReview } from "@/lib/data.client";

export default function ReviewSection({ gymId }: { gymId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [writing, setWriting] = useState(false);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  useEffect(() => {
    fetchReviews(gymId).then(setReviews);
  }, [gymId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // TODO(M2): 예약 이력 있는 유저만 작성 가능하게 제한
    await submitReview({
      gymId,
      author: author.trim() || "익명",
      rating,
      text: text.trim(),
    });
    setReviews(await fetchReviews(gymId));
    setWriting(false);
    setAuthor("");
    setRating(5);
    setText("");
  }

  return (
    <section className="mt-6 px-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-300">
          리뷰 {reviews.length}개
        </h2>
        <button
          onClick={() => setWriting((v) => !v)}
          className="text-xs font-medium text-red-400"
        >
          {writing ? "취소" : "리뷰 쓰기"}
        </button>
      </div>

      {writing && (
        <form
          onSubmit={submit}
          className="mt-3 flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4"
        >
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`text-xl ${n <= rating ? "" : "opacity-25 grayscale"}`}
              >
                ⭐
              </button>
            ))}
          </div>
          <input
            className="input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="닉네임 (선택)"
          />
          <textarea
            className="input min-h-20 resize-none"
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="체험은 어땠나요? 시설, 분위기, 코칭 스타일을 알려주세요."
          />
          <button
            type="submit"
            className="rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white active:bg-red-700"
          >
            등록
          </button>
        </form>
      )}

      <ul className="mt-3 flex flex-col gap-3">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{r.author}</p>
              <p className="text-xs text-neutral-500">{r.date}</p>
            </div>
            <p className="mt-1 text-xs text-yellow-400">
              {"⭐".repeat(r.rating)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-300">
              {r.text}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
