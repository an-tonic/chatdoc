adb connect 192.168.1.38:5555

npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res/


cd  /c/ChatDOC/android || exit

./gradlew assembleDebug

cd ..

adb install ./android/app/build/outputs/apk/debug/app-debug.apk
