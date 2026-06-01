const custom = (file: string) => `/custom-images/${file}`

export const uiAssets = {
  hero: custom('home.png'),
  emptyRoomWatermark: custom('FONDchambrePierre.png'),
  overall: custom('LISTE COURSE.png'),
  topButtons: {
    maison: custom('boutonMaMaison en Haut.png'),
    todo: custom('boutonTODOen haut.png'),
    ai: custom('home.png'),
  },
  priority: {
    low: custom('lowprio.png'),
    normal: custom('mediumprio.png'),
    high: custom('highprio.png'),
  },
  status: {
    todo: custom('EnPause.png'),
    inProgress: custom('EnCours.png'),
    done: custom('Done.png'),
  },
}
