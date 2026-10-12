import Capacitor

// La app es una sola página que muestra/oculta pantallas con JS (go()), no
// navegación real por URL — el historial del WKWebView casi nunca tiene más
// de una entrada. El gesto nativo de "deslizar desde el borde para volver"
// de iOS interpreta eso como "no hay a dónde volver" y saca de la app en vez
// de no hacer nada, en cualquier pantalla donde el usuario deslice cerca del
// borde izquierdo (reportado por Víctor en "Identidad del negocio", 2026-09-09).
// Se desactiva el gesto por completo — volver dentro de la app es siempre el
// botón "Volver" en pantalla, nunca el gesto del sistema.
class MainViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        webView?.allowsBackForwardNavigationGestures = false
    }
}
