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
    const currentOptional = config.parts.filter((p) => !fixedParts.includes(p))[0];

    if (currentOptional === part) {
      setConfig({ ...config, parts: fixedParts });
    } else {
      setConfig({ ...config, parts: [...fixedParts, part] });
    }
  };

  return (
    <div className="w-96 bg-white shadow-lg overflow-y-auto font-sans border-l border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">Rhythm Round Chair</h1>
        <p className="text-gray-500">Banquet Chair</p>
      </div>

      <div className="px-6 py-4">
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Optional Parts</h2>
          <div className="flex gap-4">
            {availableParts.map((part) => (
              <button
                key={part.value}
                className={`min-w-max flex flex-col items-center px-4 py-2 rounded-md transition ${
                  config.parts.includes(part.value)
                    ? 'bg-gray-100 border-2 border-gray-300'
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => toggleOptionalPart(part.value)}
              >
                <div className="w-12 h-12 mb-1 flex items-center justify-center">
                  {part.value === 'Optional_1' && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-8 h-8"
                    >
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  )}
                  {part.value === 'Optional_2' && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-8 h-8"
                    >
                      <polygon points="12 2 19 9 12 16 5 9" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-gray-700">{part.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Select fabric texture</h2>
          <div className="grid grid-cols-5 gap-2">
            {fabricTextures.map((texture) => (
              <button
                key={texture.value}
                className={`relative w-full aspect-square rounded-md transition ${
                  config.fabricTexture === texture.value ? 'ring-2 ring-gray-800 ring-offset-2' : 'hover:opacity-80'
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

        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Select back finish</h2>
          <div className="grid grid-cols-5 gap-2">
            {backFinishTextures.map((texture) => (
              <button
                key={texture.value}
                className={`relative w-full aspect-square rounded-md transition ${
                  config.backFinishTexture === texture.value ? 'ring-2 ring-gray-800 ring-offset-2' : 'hover:opacity-80'
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

      <div className="px-6 py-4 mt-36 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          <span className="font-medium">Configuration:</span> Standard
        </div>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-700 transition"
        >
          Save Design
        </button>
      </div>
    </div>
  );
}

function getFabricBackground(texture: string) {
  switch (texture) {
    case 'champlain':
      return 'linear-gradient(45deg, #4A4A4A, #333333)';
    case 'huron':
      return 'linear-gradient(45deg, #6B4E31, #4A3721)';
    case 'kaleidoscope':
      return 'linear-gradient(45deg, #D2691E, #A0522D)';
    case 'lugano':
      return 'linear-gradient(45deg, #DEB887, #C19A6B)';
    case 'traveller':
      return 'linear-gradient(45deg, #8B5A2B, #704214)';
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