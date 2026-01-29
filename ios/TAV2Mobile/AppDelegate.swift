import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Always use Metro bundler in development
    // For release builds, you'll need to bundle the JS separately
    let jsCodeLocation: URL
    
    // Try to get bundle URL from Metro bundler
    if let bundleURL = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index") {
      jsCodeLocation = bundleURL
    } else if let localhostURL = URL(string: "http://localhost:8081/index.bundle?platform=ios&dev=true") {
      // Fallback: use localhost directly
      jsCodeLocation = localhostURL
    } else {
      // Last resort: try to use bundled file (only if it exists)
      if let bundleURL = Bundle.main.url(forResource: "main", withExtension: "jsbundle") {
        jsCodeLocation = bundleURL
      } else {
        // This should not happen in development - Metro should be running
        print("⚠️ WARNING: Could not find JavaScript bundle. Make sure Metro bundler is running on port 8081.")
        print("   Start Metro with: npm start")
        // Use localhost as final fallback
        jsCodeLocation = URL(string: "http://localhost:8081/index.bundle?platform=ios&dev=true")!
      }
    }

    let rootView = RCTRootView(bundleURL: jsCodeLocation, moduleName: "TAV2Mobile", initialProperties: nil, launchOptions: launchOptions)
    let rootViewController = UIViewController()
    rootViewController.view = rootView
    self.window = UIWindow(frame: UIScreen.main.bounds)
    self.window?.rootViewController = rootViewController
    self.window?.makeKeyAndVisible()
    return true
  }
}
