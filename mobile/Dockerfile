FROM reactnativecommunity/react-native-android:latest

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy project files
COPY . .

# Build Android APK
RUN cd android && chmod +x gradlew && ./gradlew assembleRelease

# Copy APK to shared volume
CMD ["sh", "-c", "cp android/app/build/outputs/apk/release/app-release.apk /app/client.apk && echo 'APK built successfully'"]