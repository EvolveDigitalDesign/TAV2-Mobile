# Development Networking Guide

## Mobile App to Backend Connection

When developing a mobile app, connecting to a backend running on `localhost:8000` depends on where the app is running:

---

## ✅ iOS Simulator

**Works with `localhost:8000`**

The iOS Simulator runs on your Mac, so `localhost` refers to your Mac's localhost.

**Configuration:**
- Use: `http://localhost:8000`
- No changes needed

---

## ✅ Android Emulator

**Does NOT work with `localhost:8000`**

The Android Emulator runs in a virtual machine. `localhost` refers to the emulator itself, not your host machine.

**Solution: Use `10.0.2.2`**

- Use: `http://10.0.2.2:8000`
- `10.0.2.2` is a special IP that the Android emulator uses to access the host machine's localhost

**Configuration:**
The `env.ts` file automatically detects Android and uses `10.0.2.2:8000`

---

## ❌ Physical Devices (iOS & Android)

**Does NOT work with `localhost:8000`**

Physical devices are separate machines. `localhost` refers to the device itself, not your development machine.

**Solution: Use your machine's local IP address**

1. **Find your Mac's local IP:**
   ```bash
   # On Mac
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Or
   ipconfig getifaddr en0
   ```

   Example output: `192.168.1.100`

2. **Update API URL:**
   - Option 1: Set environment variable
     ```bash
     export VITE_API_URL=http://192.168.1.100:8000
     ```
   
   - Option 2: Modify `src/config/env.ts` temporarily
     ```typescript
     return 'http://192.168.1.100:8000';
     ```

3. **Ensure your Mac and device are on the same WiFi network**

4. **Ensure your Mac's firewall allows connections on port 8000**

---

## 🔧 Configuration

The app automatically handles iOS Simulator and Android Emulator:

- **iOS Simulator**: Uses `http://localhost:8000`
- **Android Emulator**: Uses `http://10.0.2.2:8000`

For physical devices, you need to set your machine's IP address.

---

## 🧪 Testing

### Test on iOS Simulator
```bash
npm run ios
# Backend at localhost:8000 will work
```

### Test on Android Emulator
```bash
npm run android
# Backend at 10.0.2.2:8000 will work (auto-configured)
```

### Test on Physical Device

1. Find your Mac's IP:
   ```bash
   ipconfig getifaddr en0
   ```

2. Set environment variable:
   ```bash
   export VITE_API_URL=http://192.168.1.100:8000
   npm run ios  # or npm run android
   ```

3. Or create a `.env` file (if using react-native-config):
   ```
   VITE_API_URL=http://192.168.1.100:8000
   ```

---

## 🚨 Troubleshooting

### "Network request failed" on Android Emulator
- ✅ Check that you're using `10.0.2.2:8000` (not `localhost`)
- ✅ Verify backend is running on port 8000
- ✅ Check Android emulator network settings

### "Network request failed" on Physical Device
- ✅ Use your Mac's local IP (not `localhost`)
- ✅ Ensure same WiFi network
- ✅ Check Mac firewall settings
- ✅ Verify backend is accessible from network

### "Connection refused"
- ✅ Ensure backend is running: `python manage.py runserver 0.0.0.0:8000`
- ✅ Use `0.0.0.0:8000` instead of `localhost:8000` to allow network connections
- ✅ Check firewall isn't blocking port 8000

---

## 📝 Quick Reference

| Environment | API URL |
|------------|---------|
| iOS Simulator | `http://localhost:8000` |
| Android Emulator | `http://10.0.2.2:8000` |
| Physical Device | `http://192.168.x.x:8000` (your Mac's IP) |

---

## 💡 Pro Tip

For easier development, you can create a script that:
1. Detects your Mac's IP
2. Sets the environment variable
3. Starts the app

```bash
#!/bin/bash
IP=$(ipconfig getifaddr en0)
export VITE_API_URL=http://$IP:8000
npm run ios
```
