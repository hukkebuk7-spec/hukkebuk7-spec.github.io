type ScrollLib = {
  gsap: typeof import('gsap').default
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger
}

let pending: Promise<ScrollLib> | null = null

export function loadScroll(): Promise<ScrollLib> {
  if (!pending) {
    pending = Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
      import('gsap/MotionPathPlugin'),
    ]).then(([core, trigger, motionPath]) => {
      const instance = core.default ?? core.gsap
      instance.registerPlugin(trigger.ScrollTrigger, motionPath.MotionPathPlugin)
      return { gsap: instance, ScrollTrigger: trigger.ScrollTrigger }
    })
  }
  return pending
}
