import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[app error]', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen bg-ink-grad text-ink-50 flex items-center justify-center p-6">
        <div className="panel max-w-lg w-full p-6 border-l-4 border-l-red-400">
          <div className="text-red-200 text-sm font-semibold mb-2">页面遇到一个运行错误</div>
          <h1 className="text-xl font-display text-gold-shine mb-3">科创导师没有正常加载</h1>
          <p className="text-ink-300 text-sm leading-relaxed">
            这通常是某个步骤组件的数据不完整导致的。你可以先刷新页面继续使用；如果仍然出现，把这段错误发给开发者。
          </p>
          <pre className="mt-4 max-h-40 overflow-auto rounded bg-ink-950/70 border border-ink-700 p-3 text-xs text-red-100 whitespace-pre-wrap">
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="btn-gold mt-5 text-sm"
          >
            刷新页面
          </button>
        </div>
      </div>
    )
  }
}
