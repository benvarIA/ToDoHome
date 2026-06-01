const room = (file: string) => `/custom-images/${file}`

export const roomImageCatalog = {
  cuisine: room('cuisine.png'),
  salon: room('salon.png'),
  salleDeBain: room('sdb.png'),
  chambreParents: room('chambreparent.png'),
  chambrePierre: room('chambrepierre.png'),
  balcon: room('balcon.png'),
  couloir: room('couloir.png'),
  cave: room('cave.png'),
  wc: room('wc.png'),
} as const

export const roomImageOptions = [
  roomImageCatalog.cuisine,
  roomImageCatalog.salon,
  roomImageCatalog.salleDeBain,
  roomImageCatalog.chambreParents,
  roomImageCatalog.chambrePierre,
  roomImageCatalog.balcon,
  roomImageCatalog.couloir,
  roomImageCatalog.cave,
  roomImageCatalog.wc,
]

export const roomImageForName = (name: string) => {
  const normalized = name.toLowerCase()
  if (normalized.includes('cuisine')) return roomImageCatalog.cuisine
  if (normalized.includes('salon')) return roomImageCatalog.salon
  if (normalized.includes('bain')) return roomImageCatalog.salleDeBain
  if (normalized.includes('pierre')) return roomImageCatalog.chambrePierre
  if (normalized.includes('chambre')) return roomImageCatalog.chambreParents
  if (normalized.includes('couloir') || normalized.includes('entrée') || normalized.includes('entree'))
    return roomImageCatalog.couloir
  if (normalized.includes('cave')) return roomImageCatalog.cave
  if (normalized.includes('wc') || normalized.includes('toilette')) return roomImageCatalog.wc
  if (normalized.includes('balcon')) return roomImageCatalog.balcon
  return roomImageCatalog.cuisine
}
