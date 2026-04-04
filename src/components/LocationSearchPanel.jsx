const LocationSearchPanel = ({
  suggestions,
  setPanelOpen,
  setPickup,
  setDestination,
  activeField
}) => {
  return (
    <div>
      {suggestions.map((item, index) => (
        <div
          key={index}
          onClick={() => {
            if (activeField === "pickup") {
              setPickup(item.description)
            } else {
              setDestination(item.description)
            }
            setPanelOpen(false)
          }}
          className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/10 transition border-b border-white/10 last:border-none"
        >
          <i className="ri-map-pin-line text-amber-400 text-lg mt-1"></i>

          <div>
            <p className="text-sm font-medium text-gray-200">
              {item.description}
            </p>
            <p className="text-xs text-gray-500">
              Tap to select
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LocationSearchPanel