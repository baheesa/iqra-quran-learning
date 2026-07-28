#!/usr/bin/env bash
# Build debug APK using local portable JDK + SDK under offline-apk/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export JAVA_HOME="${JAVA_HOME:-}"
# Prefer JDK 21 (Capacitor / Android Gradle need it); fall back to any local JDK.
if [ -z "${JAVA_HOME}" ] || [ ! -x "${JAVA_HOME}/bin/java" ]; then
  JAVA_HOME="$(find "$ROOT/.jdk" -type f -path '*/Contents/Home/bin/java' 2>/dev/null | grep -E 'jdk-21|/21\.' | head -1 | sed 's|/bin/java||')"
fi
if [ -z "${JAVA_HOME}" ] || [ ! -x "${JAVA_HOME}/bin/java" ]; then
  JAVA_HOME="$(find "$ROOT/.jdk" -type f -path '*/Contents/Home/bin/java' 2>/dev/null | head -1 | sed 's|/bin/java||')"
fi
export JAVA_HOME
export ANDROID_HOME="${ANDROID_HOME:-$ROOT/.android-sdk}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "JAVA_HOME=$JAVA_HOME"
echo "ANDROID_HOME=$ANDROID_HOME"
"$JAVA_HOME/bin/java" -version

npm run sync:data
npm run build
npx cap sync android

echo "sdk.dir=$ANDROID_HOME" > android/local.properties

cd android
./gradlew assembleDebug
mkdir -p "$ROOT/dist-apk"
cp app/build/outputs/apk/debug/app-debug.apk "$ROOT/dist-apk/quran-learn-offline-debug.apk"
ls -lh "$ROOT/dist-apk/quran-learn-offline-debug.apk"
echo "APK ready: $ROOT/dist-apk/quran-learn-offline-debug.apk"
