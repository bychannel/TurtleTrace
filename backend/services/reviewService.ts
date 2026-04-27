import redis from './redis';
import { DailyReview } from '../types';

const REVIEWS_KEY = 'turtletrace:reviews:daily';

export async function getReviews(): Promise<DailyReview[]> {
  const data = await redis.get(REVIEWS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveReviews(reviews: DailyReview[]): Promise<void> {
  await redis.set(REVIEWS_KEY, JSON.stringify(reviews));
}

export async function getReviewByDate(date: string): Promise<DailyReview | null> {
  const reviews = await getReviews();
  return reviews.find(r => r.date === date) ?? null;
}

export async function getReviewsByDateRange(startDate: string, endDate: string): Promise<DailyReview[]> {
  const reviews = await getReviews();
  return reviews.filter(r => r.date >= startDate && r.date <= endDate);
}

export async function saveReview(review: DailyReview): Promise<DailyReview> {
  const reviews = await getReviews();
  const index = reviews.findIndex(r => r.date === review.date);

  if (index >= 0) {
    reviews[index] = { ...review, updatedAt: Date.now() };
  } else {
    reviews.push({ ...review, createdAt: Date.now(), updatedAt: Date.now() });
  }

  await saveReviews(reviews);
  return review;
}

export async function deleteReview(date: string): Promise<void> {
  const reviews = await getReviews();
  const index = reviews.findIndex(r => r.date === date);
  if (index === -1) throw new Error('Review not found');

  reviews.splice(index, 1);
  await saveReviews(reviews);
}
