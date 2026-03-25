import SwiftUI

struct LoginView: View {
    var onSignIn: () -> Void
    var onContinueAsGuest: () -> Void

    @State private var email: String = ""
    @State private var password: String = ""

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            VStack(spacing: 8) {
                HStack(spacing: 8) {
                    Image(systemName: "bolt.horizontal.circle.fill")
                        .foregroundStyle(Color.cyberSaffron)
                        .font(.title)
                    Text("SWIFTIE // CYBER")
                        .font(.headline)
                        .foregroundStyle(Color.cyberGreen)
                        .tracking(2)
                }
                Text("ENTER THE SPRAWL")
                    .font(.largeTitle.bold())
                    .foregroundStyle(.white)
                Text("Connect with the street samurai and netrunners of Neo-Delhi.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.gray)
                    .padding(.horizontal, 20)
            }

            VStack(spacing: 16) {
                TextField("Alias or Email", text: $email)
                #if os(iOS)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                #endif
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .colorScheme(.dark)
                
                SecureField("Passcode", text: $password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .colorScheme(.dark)
                
                Button(action: onSignIn) {
                    Text("Jack In")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(Color.cyberSaffron)
                .padding(.top, 8)

                Button("Ghost Mode (Demo)") { onContinueAsGuest() }
                    .foregroundStyle(Color.cyberBlue)
            }
            .padding(.horizontal, 24)
            
            Spacer()
            
            HStack(spacing: 6) {
                Text("New to the network?")
                    .foregroundStyle(.gray)
                Button("Register here") {}
                    .foregroundStyle(Color.cyberSaffron)
            }
            .font(.footnote)
        }
        .padding()
        .slBackground()
    }
}
