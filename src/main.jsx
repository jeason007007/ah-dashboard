import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)

// 隐藏加载动画
window.addEventListener('load', () => {
    const loading = document.getElementById('loading')
    const root = document.getElementById('root')
    if (loading && root) {
        loading.style.opacity = '0'
        loading.style.transition = 'opacity 0.5s ease'
        setTimeout(() => {
            loading.style.display = 'none'
            root.style.display = 'block'
        }, 500)
    }
})
