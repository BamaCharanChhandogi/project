import { ChairConfig } from './ChairConfigurator';

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

const backStyles = [
  { name: 'Standard', value: 'standard' },
  { name: 'Welted', value: 'welted' },
];

const availableParts = [
  { name: 'Optional 1', value: 'Optional_1', fixed: false },
  { name: 'Optional 2', value: 'Optional_2', fixed: false },
];

interface ConfigPanelProps {
  config: ChairConfig;
  setConfig: (config: ChairConfig) => void;
  onSave: () => void;
  onClose?: () => void;
}

export function ConfigPanel({ config, setConfig, onSave, onClose }: ConfigPanelProps) {
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
    <div className="flex flex-col max-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Configure Chair</h2>
          <p className="text-xs text-gray-500">Customize your design</p>
        </div>
        <button 
          onClick={onClose}
          className="md:hidden text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Back Style Selection */}
        {/* <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Back Style</h3>
          <div className="grid grid-cols-2 gap-2">
            {backStyles.map((style) => (
              <button
                key={style.value}
                className={`px-3 py-2 text-sm border rounded-md transition ${
                  config.backStyle === style.value 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setConfig({ ...config, backStyle: style.value as 'standard' | 'welted' })}
              >
                {style.name}
              </button>
            ))}
          </div>
        </div> */}

        {/* Optional Parts */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Optional Features</h3>
          <div className="flex gap-2">
            {availableParts.map((part) => (
              <button
                key={part.value}
                className={`flex-1 flex flex-col items-center p-3 rounded-md transition ${
                  config.parts.includes(part.value)
                    ? 'bg-blue-50 border-2 border-blue-300'
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => toggleOptionalPart(part.value)}
              >
                <div className="w-8 h-8 mb-1 flex items-center justify-center">
                  {part.value === 'Optional_1' && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-6 h-6"
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
                      className="w-6 h-6"
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

        {/* Fabric Texture Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Fabric Texture</h3>
          <div className="grid grid-cols-5 gap-2">
            {fabricTextures.map((texture) => (
              <button
                key={texture.value}
                className={`relative w-full aspect-square rounded-md transition ${
                  config.fabricTexture === texture.value ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:opacity-80'
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
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">DVC Fabrics</p>
        </div>

        {/* Metal Finish Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Metal Finish</h3>
          <div className="grid grid-cols-3 gap-2">
            {backFinishTextures.map((texture) => (
              <button
                key={texture.value}
                className={`relative w-full aspect-square rounded-md transition ${
                  config.backFinishTexture === texture.value ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:opacity-80'
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
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">Metal Finishes</p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <button
          onClick={onSave}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
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