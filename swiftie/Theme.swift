import SwiftUI

struct SLBackground: ViewModifier {
    func body(content: Content) -> some View {
        ZStack {
            LinearGradient(
                colors: [Color.black, Color(red: 0.0, green: 0.06, blue: 0.20)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            content
        }
        .tint(Color.cyberSaffron)
        .preferredColorScheme(.dark)
    }
}

extension View {
    func slBackground() -> some View { self.modifier(SLBackground()) }
}

extension Color {
    // Neon Indian Tricolour accents
    static let cyberSaffron = Color(red: 1.0, green: 0.6, blue: 0.2)
    static let darkSaffron = Color(red: 0.6, green: 0.3, blue: 0.0)
    static let cyberGreen = Color(red: 0.1, green: 0.8, blue: 0.2)
    static let cyberBlue = Color(red: 0.0, green: 0.2, blue: 0.6)
}
