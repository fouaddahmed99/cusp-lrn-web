"use client";
import { content } from "@/adapters/content";
import { progress } from "@/adapters/progress";
import type { PublicItemStub } from "@/contract";
import type { Attempt, Mark, Profile, StoredCard } from "@/lib/types";
import { useAsync, useProgressVersion } from "./hooks";

export interface StudyData {
  stubs: PublicItemStub[];
  attempts: Attempt[];
  marks: Mark[];
  cards: StoredCard[];
  profile: Profile;
}

/** Everything most study pages need, refreshed whenever on-device progress changes. */
export function useStudyData() {
  const v = useProgressVersion();
  return useAsync<StudyData>(async () => {
    const [stubs, attempts, marks, cards, profile] = await Promise.all([content.listStubs(), progress.attempts(), progress.marks(), progress.cards(), progress.profile()]);
    return { stubs, attempts, marks, cards, profile };
  }, [v]);
}
