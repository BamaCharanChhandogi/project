import { ChairConfig } from './ChairConfigurator';

const fabricColors = [
  { name: 'Burgundy', value: '#800020' },
  { name: 'Gold', value: '#FFD700' },
  { name: 'Charcoal', value: '#4A4A4A' },
  { name: 'Navy', value: '#000080' },
  { name: 'Purple', value: '#800080' },
  { name: 'Olive', value: '#808000' },
];

const backStyles = [
  { name: 'Standard', value: 'standard' },
  { name: 'Welted', value: 'welted' },
];

const availableParts = [
  // { name: 'Cushion & Seat', value: 'Cushion_Seat', fixed: true },
  // { name: 'Legs', value: 'Legs', fixed: true },
  { name: 'Optional 1', value: 'Optional_1', fixed: false },
  { name: 'Optional 2', value: 'Optional_2', fixed: false },
];

const fabricTextures = [
  { name: 'Champlain', value: 'champlain' },
  { name: 'Huron', value: 'huron' },
  { name: 'Kaleidoscope', value: 'kaleidoscope' },
  { name: 'Lugano', value: 'lugano' },
  { name: 'Traveller', value: 'traveller' },
];

const backFinishTextures = [
  { name: 'Antique English', value: 'antique' },
  { name: 'Brushed Nickel', value: 'brushed' },
  { name: 'Satin Nickel', value: 'satin' },
];

interface ConfigPanelProps {
  config: ChairConfig;
  setConfig: (config: ChairConfig) => void;
  onSave: () => void;
}

export function ConfigPanel({ config, setConfig, onSave }: ConfigPanelProps) {
  const toggleOptionalPart = (part: string) => {
    const fixedParts = ['Cushion_Seat', 'Legs'];
    const currentOptional = config.parts.filter((p) => !fixedParts.includes(p))[0]; // Get current optional part, if any

    if (currentOptional === part) {
      // If the clicked part is already selected, remove it (toggle off)
      setConfig({ ...config, parts: fixedParts });
    } else {
      // Replace the current optional part with the new one
      setConfig({ ...config, parts: [...fixedParts, part] });
    }
  };

  return (
    <div className="w-96 bg-white shadow-lg overflow-y-auto font-sans border-l border-gray-100">
      {/* Header with product name */}
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">Rhythm Round Chair</h1>
        <p className="text-gray-500">Banquet Chair</p>
        <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
          </svg>
        </button>
      </div>

      {/* Configuration options */}
      <div className="px-6 py-4">
        {/* Component Selection Tabs */}
        <div className="mb-8">
          <div className="flex overflow-x-auto pb-2 mb-4 gap-2">
            {availableParts.map((part) => (
              <button
                key={part.value}
                className={`min-w-max flex flex-col items-center px-4 py-2 rounded-md transition ${
                  config.parts.includes(part.value)
                    ? 'bg-gray-100 border-2 border-gray-300'
                    : 'border border-gray-200 hover:bg-gray-50'
                } ${part.fixed ? 'cursor-default opacity-75' : ''}`}
                onClick={!part.fixed ? () => toggleOptionalPart(part.value) : undefined}
              >
                <div className="w-12 h-12 mb-1 flex items-center justify-center">
                  {part.value === 'Cushion_Seat' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                      <rect x="4" y="10" width="16" height="6" rx="1" />
                    </svg>
                  )}
                  {part.value === 'Legs' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                      <path d="M6 10 L4 22 M18 10 L20 22 M8 10 L7 22 M16 10 L17 22" />
                    </svg>
                  )}
                  {part.value === 'Optional_1' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  )}
                  {part.value === 'Optional_2' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                      <polygon points="12 2 19 9 12 16 5 9" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-gray-700">{part.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Back Style Selection */}
        {/* <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Select back</h2>
          <div className="flex gap-4">
            {backStyles.map((style) => (
              <button
                key={style.value}
                className={`relative bg-gray-100 border w-16 h-16 rounded-md flex items-center justify-center transition ${
                  config.backStyle === style.value
                    ? 'border-gray-800 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() =>
                  setConfig({ ...config, backStyle: style.value as 'standard' | 'welted' })
                }
                title={style.name}
              >
                {style.value === 'standard' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
                    <path d="M7 5h10v12H7z" />
                  </svg>
                )}
                {style.value === 'welted' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
                    <path d="M7 5h10v12H7z" />
                    <path d="M8 7h8" />
                    <path d="M8 9h8" />
                    <path d="M8 11h8" />
                  </svg>
                )}
                <span className="absolute -bottom-6 text-xs text-gray-600">{style.name}</span>
              </button>
            ))}
          </div>
        </div> */}

        {/* Fabric Texture Selection */}
        <div className="mb-8 ">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Select fabric texture</h2>
          <div className="grid grid-cols-5 gap-2">
            {fabricTextures.map((texture) => (
              <button
                key={texture.value}
                className={`relative w-full aspect-square rounded-md transition ${
                  config.fabricTexture === texture.value
                    ? 'ring-2 ring-gray-800 ring-offset-2'
                    : 'hover:opacity-80'
                }`}
                style={{ background: getFabricBackground(texture.value) }}
                onClick={() =>
                  setConfig({
                    ...config,
                    fabricTexture: texture.value as 'champlain' | 'huron' | 'kaleidoscope' | 'lugano' | 'traveller',
                  })
                }
                title={texture.name}
              >
                {config.fabricTexture === texture.value && (
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">DVC Fabrics</p>
        </div>

        {/* Back Finish Texture Selection */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Select back finish</h2>
          <div className="grid grid-cols-5 gap-2">
            {backFinishTextures.map((texture) => (
              <button
                key={texture.value}
                className={`relative w-full aspect-square rounded-md transition ${
                  config.backFinishTexture === texture.value
                    ? 'ring-2 ring-gray-800 ring-offset-2'
                    : 'hover:opacity-80'
                }`}
                style={{ background: getMetalBackground(texture.value) }}
                onClick={() =>
                  setConfig({
                    ...config,
                    backFinishTexture: texture.value as 'antique' | 'brushed' | 'satin',
                  })
                }
                title={texture.name}
              >
                {config.backFinishTexture === texture.value && (
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">Metal Finishes</p>
        </div>
      </div>

      {/* Footer with controls */}
      <div className="px-6 py-4 mt-36 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          <span className="font-medium">Configuration:</span> Standard
        </div>
        <button onClick={onSave} className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-700 transition">
          Save Design
        </button>
      </div>
    </div>
  );
}

// Helper functions to generate background styles for different textures
function getFabricBackground(texture: string) {
  switch (texture) {
    case 'champlain':
      return 'linear-gradient(45deg, #4A4A4A, #333333)'; // Charcoal-like, based on the dark BaseColor
    case 'huron':
      return 'linear-gradient(45deg, #6B4E31, #4A3721)'; // Earthy brown, based on the BaseColor
    case 'kaleidoscope':
      return 'linear-gradient(45deg, #D2691E, #A0522D)'; // Warm orange-brown, based on the BaseColor
    case 'lugano':
      return 'linear-gradient(45deg, #DEB887, #C19A6B)'; // Light tan, based on the BaseColor
    case 'traveller':
      return 'linear-gradient(45deg, #8B5A2B, #704214)'; // Rich brown, based on the BaseColor
    default:
      return 'linear-gradient(45deg, #4A4A4A, #333333)';
  }
}

function getMetalBackground(texture: string) {
  switch (texture) {
    case 'antique':
      return 'linear-gradient(135deg, #9f8170, #7d6455)';
    case 'brushed':
      return 'linear-gradient(135deg, #C0C0C0, #A9A9A9)';
    case 'satin':
      return 'linear-gradient(135deg, #b5b5b5, #8f8f8f)';
    default:
      return '#A9A9A9';
  }
}