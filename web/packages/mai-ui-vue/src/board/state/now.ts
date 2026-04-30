import { onMounted, onUnmounted, ref } from "vue";

const MS_PER_MINUTE = 60_000;

export function millisecondsUntilNextMinute(now: Date): number {
  const remainder = now.getSeconds() * 1000 + now.getMilliseconds();
  return remainder === 0 ? MS_PER_MINUTE : MS_PER_MINUTE - remainder;
}

export function useMinuteNow() {
  const now = ref(new Date());
  let minuteInterval: ReturnType<typeof setInterval> | null = null;
  let alignTimeout: ReturnType<typeof setTimeout> | null = null;

  function clearTimers() {
    if (alignTimeout) {
      clearTimeout(alignTimeout);
      alignTimeout = null;
    }
    if (minuteInterval) {
      clearInterval(minuteInterval);
      minuteInterval = null;
    }
  }

  function startTicking() {
    now.value = new Date();
    alignTimeout = setTimeout(() => {
      now.value = new Date();
      minuteInterval = setInterval(() => {
        now.value = new Date();
      }, MS_PER_MINUTE);
    }, millisecondsUntilNextMinute(now.value));
  }

  onMounted(() => {
    if (typeof window === "undefined") {
      return;
    }
    startTicking();
  });

  onUnmounted(() => {
    clearTimers();
  });

  return now;
}
