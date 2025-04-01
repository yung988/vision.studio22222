import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string
}

class WebGLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false,
      errorMessage: ''
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorMessage: error.message || 'Došlo k chybě při vykreslování 3D obsahu'
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to an error reporting service
    console.error('WebGL Error:', error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="webgl-error">
          <h2>Nepodařilo se načíst 3D scénu</h2>
          <p>{this.state.errorMessage}</p>
          <p>Zkuste prosím:</p>
          <ul style={{ textAlign: 'left', marginTop: '15px', listStylePosition: 'inside' }}>
            <li>Obnovit stránku</li>
            <li>Použít jiný prohlížeč (Chrome, Firefox, Edge)</li>
            <li>Zkontrolovat, zda máte povolen WebGL a 3D akceleraci</li>
            <li>Aktualizovat ovladače grafické karty</li>
          </ul>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '8px 16px',
              background: '#3050ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Zkusit znovu
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default WebGLErrorBoundary 