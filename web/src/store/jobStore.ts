import { create } from 'zustand'
import type { Job, Item } from '../types'

interface JobStore {
  jobs: Job[]
  selectedJob: Job | null
  items: Item[]
  imageDir: string
  setJobs: (jobs: Job[]) => void
  setSelectedJob: (job: Job | null) => void
  updateSelectedJob: (updater: (job: Job) => Job) => void
  setItems: (items: Item[]) => void
  setImageDir: (dir: string) => void
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  selectedJob: null,
  items: [],
  imageDir: 'nui://ox_inventory/web/images/',
  setJobs: (jobs) => set({ jobs }),
  setSelectedJob: (job) => set({ selectedJob: job }),
  updateSelectedJob: (updater) => {
    const current = get().selectedJob
    if (current) {
      set({ selectedJob: updater(current) })
    }
  },
  setItems: (items) => set({ items }),
  setImageDir: (dir) => set({ imageDir: dir }),
}))
