import SwiftUI

struct CardContainer<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }

    var body: some View {
        content
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(Color.slSecondaryBG.opacity(0.8))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(LinearGradient(colors: [.cyberSaffron, .cyberBlue], startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: 1.5)
                            .shadow(color: Color.cyberSaffron.opacity(0.3), radius: 4)
                    )
            )
    }
}

struct CapsuleTag: View {
    var text: String
    var color: Color = .cyberGreen

    var body: some View {
        Text(text)
            .font(.caption2.weight(.bold))
            .foregroundStyle(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(
                Capsule()
                    .fill(Color.black.opacity(0.6))
                    .overlay(
                        Capsule().stroke(color, lineWidth: 1)
                            .shadow(color: color.opacity(0.4), radius: 3)
                    )
            )
    }
}

struct StatPill: View {
    var title: String
    var value: String
    var systemImage: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: systemImage)
                .foregroundStyle(Color.cyberSaffron)
            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.headline)
                    .foregroundStyle(.white)
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.gray)
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.black.opacity(0.7))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(Color.cyberBlue, lineWidth: 1)
                        .shadow(color: Color.cyberBlue.opacity(0.4), radius: 3)
                )
        )
    }
}

extension View {
    func sectionHeader(_ title: String) -> some View {
        self
            .overlay(alignment: .topLeading) {
                Text(title)
                    .font(.headline.weight(.bold))
                    .foregroundStyle(Color.cyberSaffron)
                    .padding(.bottom, 4)
            }
    }
}
extension Color {
    static var slSecondaryBG: Color {
        return Color(red: 0.05, green: 0.05, blue: 0.1)
    }

    static var slTertiaryBG: Color {
        return Color(red: 0.02, green: 0.02, blue: 0.05)
    }
}
