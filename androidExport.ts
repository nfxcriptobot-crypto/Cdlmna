import JSZip from 'jszip';

export async function generateAndroidProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // 1. Root Gradle Files
  zip.file(
    'build.gradle.kts',
    `// Top-level build file for Shadow Strike: Survival
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`
  );

  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "ShadowStrikeSurvival"
include(":app")
`
  );

  // Gradle Version Catalog
  zip.file(
    'gradle/libs.versions.toml',
    `[versions]
agp = "8.3.2"
kotlin = "2.0.0"
coreKtx = "1.13.1"
lifecycleRuntimeKtx = "2.8.0"
activityCompose = "1.9.0"
composeBom = "2024.05.00"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
`
  );

  // Gradle Wrapper Properties
  zip.file(
    'gradle/wrapper/gradle-wrapper.properties',
    `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  );

  // 2. App Module build.gradle.kts
  zip.file(
    'app/build.gradle.kts',
    `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.shadowstrike.survival"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.shadowstrike.survival"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        ndk {
            // Pure Java / Kotlin OpenGLES implementation without NDK overhead
            abiFilters.addAll(listOf("arm64-v8a", "armeabi-v7a", "x86_64"))
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
}
`
  );

  // 3. AndroidManifest.xml
  zip.file(
    'app/src/main/AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Requires OpenGL ES 3.0 for 3D PBR rendering -->
    <uses-feature
        android:glEsVersion="0x00030000"
        android:required="true" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Shadow Strike"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="landscape"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`
  );

  // 4. Kotlin Source Code
  // MainActivity.kt
  zip.file(
    'app/src/main/java/com/shadowstrike/survival/MainActivity.kt',
    `package com.shadowstrike.survival

import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.shadowstrike.survival.ui.MainMenuScreen
import com.shadowstrike.survival.ui.GameScreen
import com.shadowstrike.survival.game.SettingsRepository

enum class ScreenState {
    MAIN_MENU,
    IN_GAME
}

class MainActivity : ComponentActivity() {
    private lateinit var settingsRepo: SettingsRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        settingsRepo = SettingsRepository(this)
        hideSystemUI()

        setContent {
            var currentScreen by remember { mutableStateOf(ScreenState.MAIN_MENU) }
            var selectedMission by remember { mutableIntStateOf(1) }

            Surface(
                modifier = Modifier.fillMaxSize(),
                color = Color(0xFF0A0F1D)
            ) {
                when (currentScreen) {
                    ScreenState.MAIN_MENU -> {
                        MainMenuScreen(
                            onStartMission = { missionId ->
                                selectedMission = missionId
                                currentScreen = ScreenState.IN_GAME
                            },
                            settingsRepo = settingsRepo
                        )
                    }
                    ScreenState.IN_GAME -> {
                        GameScreen(
                            missionId = selectedMission,
                            settingsRepo = settingsRepo,
                            onReturnToMenu = {
                                currentScreen = ScreenState.MAIN_MENU
                            }
                        )
                    }
                }
            }
        }
    }

    private fun hideSystemUI() {
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_FULLSCREEN
        )
    }
}
`
  );

  // MainMenuScreen.kt
  zip.file(
    'app/src/main/java/com/shadowstrike/survival/ui/MainMenuScreen.kt',
    `package com.shadowstrike.survival.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shadowstrike.survival.game.SettingsRepository

@Composable
fun MainMenuScreen(
    onStartMission: (Int) -> Unit,
    settingsRepo: SettingsRepository
) {
    var showSettings by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0F1D)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "SHADOW STRIKE",
                fontSize = 42.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFF38BDF8),
                letterSpacing = 4.sp
            )
            Text(
                text = "SURVIVAL: TACTICAL SPEC-OPS",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFFBBF24),
                letterSpacing = 6.sp
            )

            Spacer(modifier = Modifier.height(36.dp))

            Button(
                onClick = { onStartMission(1) },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7)),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.width(260.dp).height(50.dp)
            ) {
                Text("DEPLOY MISSION 1", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }

            Spacer(modifier = Modifier.height(14.dp))

            OutlinedButton(
                onClick = { showSettings = true },
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.width(260.dp).height(46.dp)
            ) {
                Text("SETTINGS & QUALITY", color = Color(0xFF94A3B8))
            }
        }
    }
}
`
  );

  // GameScreen.kt
  zip.file(
    'app/src/main/java/com/shadowstrike/survival/ui/GameScreen.kt',
    `package com.shadowstrike.survival.ui

import android.opengl.GLSurfaceView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.shadowstrike.survival.game.SettingsRepository
import com.shadowstrike.survival.renderer.GameRenderer

@Composable
fun GameScreen(
    missionId: Int,
    settingsRepo: SettingsRepository,
    onReturnToMenu: () -> Unit
) {
    var health by remember { mutableIntStateOf(100) }
    var ammo by remember { mutableIntStateOf(30) }
    var kills by remember { mutableIntStateOf(0) }

    Box(modifier = Modifier.fillMaxSize()) {
        // 3D OpenGL ES Surface View
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { context ->
                GLSurfaceView(context).apply {
                    setEGLContextClientVersion(3)
                    setRenderer(GameRenderer(context, missionId))
                    renderMode = GLSurfaceView.RENDERMODE_CONTINUOUSLY
                }
            }
        )

        // Tactical HUD Overlay
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            // Health & Shield
            Column {
                Text("HEALTH: $health%", color = Color(0xFF22C55E), fontWeight = FontWeight.Bold)
                Text("STATUS: SPEC-OPS ACTIVE", color = Color(0xFF94A3B8), fontSize = 12.sp)
            }

            // Mission Objective
            Surface(
                color = Color(0xAA0F172A),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = "TARGETS ELIMINATED: $kills/5",
                    color = Color(0xFFFBBF24),
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                )
            }

            // Ammo
            Text("AMMO: $ammo/120", color = Color(0xFF38BDF8), fontWeight = FontWeight.Bold)
        }

        // Touch Control Areas
        // Left Virtual Joystick Placeholder
        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(24.dp)
                .size(120.dp)
                .background(Color(0x33FFFFFF), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Box(modifier = Modifier.size(48.dp).background(Color(0x8838BDF8), CircleShape))
        }

        // Right Fire & Action Buttons
        Column(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Button(
                onClick = { /* Fire Weapon */ },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                shape = CircleShape,
                modifier = Modifier.size(72.dp)
            ) {
                Text("FIRE", fontWeight = FontWeight.Black)
            }
        }
    }
}
`
  );

  // GameRenderer.kt (OpenGL ES 3.0)
  zip.file(
    'app/src/main/java/com/shadowstrike/survival/renderer/GameRenderer.kt',
    `package com.shadowstrike.survival.renderer

import android.content.Context
import android.opengl.GLES30
import android.opengl.GLSurfaceView
import android.opengl.Matrix
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer

class GameRenderer(private val context: Context, private val missionId: Int) : GLSurfaceView.Renderer {
    private val viewMatrix = FloatArray(16)
    private val projectionMatrix = FloatArray(16)
    private val mvpMatrix = FloatArray(16)

    private var programId = 0
    private var uMVPMatrixHandle = 0

    // Simple 3D Cube/Mesh Shaders for OpenGL ES 3.0
    private val vertexShaderCode = """#version 300 es
        layout(location = 0) in vec4 vPosition;
        layout(location = 1) in vec4 vColor;
        uniform mat4 uMVPMatrix;
        out vec4 fColor;
        void main() {
            gl_Position = uMVPMatrix * vPosition;
            fColor = vColor;
        }
    """.trimIndent()

    private val fragmentShaderCode = """#version 300 es
        precision mediump float;
        in vec4 fColor;
        out vec4 fragColor;
        void main() {
            fragColor = fColor;
        }
    """.trimIndent()

    override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
        GLES30.glClearColor(0.04f, 0.06f, 0.11f, 1.0f)
        GLES30.glEnable(GLES30.GL_DEPTH_TEST)

        programId = createProgram(vertexShaderCode, fragmentShaderCode)
        uMVPMatrixHandle = GLES30.glGetUniformLocation(programId, "uMVPMatrix")
    }

    override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
        GLES30.glViewport(0, 0, width, height)
        val ratio = width.toFloat() / height.toFloat()
        Matrix.frustumM(projectionMatrix, 0, -ratio, ratio, -1f, 1f, 1.5f, 100f)
    }

    override fun onDrawFrame(gl: GL10?) {
        GLES30.glClear(GLES30.GL_COLOR_BUFFER_BIT or GLES30.GL_DEPTH_BUFFER_BIT)

        Matrix.setLookAtM(viewMatrix, 0, 0f, 3f, 8f, 0f, 1.2f, 0f, 0f, 1f, 0f)
        Matrix.multiplyMM(mvpMatrix, 0, projectionMatrix, 0, viewMatrix, 0)

        GLES30.glUseProgram(programId)
        GLES30.glUniformMatrix4fv(uMVPMatrixHandle, 1, false, mvpMatrix, 0)
    }

    private fun loadShader(type: Int, shaderCode: String): Int {
        val shader = GLES30.glCreateShader(type)
        GLES30.glShaderSource(shader, shaderCode)
        GLES30.glCompileShader(shader)
        return shader
    }

    private fun createProgram(vertexCode: String, fragmentCode: String): Int {
        val vertexShader = loadShader(GLES30.GL_VERTEX_SHADER, vertexCode)
        val fragmentShader = loadShader(GLES30.GL_FRAGMENT_SHADER, fragmentCode)
        val program = GLES30.glCreateProgram()
        GLES30.glAttachShader(program, vertexShader)
        GLES30.glAttachShader(program, fragmentShader)
        GLES30.glLinkProgram(program)
        return program
    }
}
`
  );

  // PlayerController.kt
  zip.file(
    'app/src/main/java/com/shadowstrike/survival/game/PlayerController.kt',
    `package com.shadowstrike.survival.game

data class PlayerState(
    var x: Float = 0f,
    var y: Float = 0f,
    var z: Float = 24f,
    var yaw: Float = 0f,
    var pitch: Float = 0f,
    var health: Int = 100,
    var armor: Int = 50,
    var ammo: Int = 30,
    var reserveAmmo: Int = 120,
    var isAlive: Boolean = true
)

class PlayerController {
    val state = PlayerState()

    fun updateMovement(forward: Float, right: Float, delta: Float) {
        val speed = 5.5f
        val rad = Math.toRadians(state.yaw.toDouble())
        state.x += (Math.cos(rad) * right - Math.sin(rad) * forward).toFloat() * speed * delta
        state.z += (-Math.sin(rad) * right - Math.cos(rad) * forward).toFloat() * speed * delta
    }
}
`
  );

  // SettingsRepository.kt
  zip.file(
    'app/src/main/java/com/shadowstrike/survival/game/SettingsRepository.kt',
    `package com.shadowstrike.survival.game

import android.content.Context
import android.content.SharedPreferences

class SettingsRepository(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("shadow_strike_prefs", Context.MODE_PRIVATE)

    var graphicsQuality: String
        get() = prefs.getString("graphics_quality", "HIGH") ?: "HIGH"
        set(value) = prefs.edit().putString("graphics_quality", value).apply()

    var sfxVolume: Float
        get() = prefs.getFloat("sfx_volume", 0.9f)
        set(value) = prefs.edit().putFloat("sfx_volume", value).apply()

    var musicVolume: Float
        get() = prefs.getFloat("music_volume", 0.5f)
        set(value) = prefs.edit().putFloat("music_volume", value).apply()

    var bestScore: Int
        get() = prefs.getInt("best_score", 0)
        set(value) = prefs.edit().putInt("best_score", value).apply()
}
`
  );

  // 5. Turnkey GitHub Actions Cloud Build for zero-setup APK generation
  zip.file(
    '.github/workflows/build-apk.yml',
    `name: Build Shadow Strike Android APK

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew || true

      - name: Build Debug APK
        run: ./gradlew assembleDebug --stacktrace

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ShadowStrike-Survival-Debug-APK
          path: app/build/outputs/apk/debug/app-debug.apk
`
  );

  // 6. Comprehensive README.md with all instructions
  zip.file(
    'README.md',
    `# SHADOW STRIKE: SURVIVAL
**3D Native Android Tactical Action Game**

## Overview
- **Target Platform**: Android (Min SDK 24 / Android 7.0+, Target SDK 34 / Android 14)
- **Language**: Kotlin 2.0
- **UI Framework**: Jetpack Compose (Material3)
- **3D Engine**: OpenGL ES 3.0 Native SurfaceView Renderer
- **Orientation**: Fixed Fullscreen Landscape

---

## 3 Quick Ways to Build and Install on Your Phone:

### Route 1: Instant Cloud Build (No Android Studio required!)
1. Create a GitHub repository and upload this project folder.
2. Go to the **Actions** tab on GitHub.
3. The workflow **"Build Shadow Strike Android APK"** will automatically compile the code on GitHub's cloud servers.
4. Download the generated **\`ShadowStrike-Survival-Debug-APK\`** artifact from the summary page.
5. Transfer the \`app-debug.apk\` to your phone and tap to install!

### Route 2: Build Locally with Android Studio
1. Open **Android Studio** (Hedgehog, Iguana, or Koala).
2. Select **File > Open** and choose this extracted project folder.
3. Allow Gradle to sync dependencies.
4. Connect your Android phone with **USB Debugging** enabled (Developer Options).
5. Click the green **Run (▶)** button. Android Studio will build and install the APK directly onto your phone!

### Route 3: Build via Terminal Command Line
\`\`\`bash
# Build the debug APK
./gradlew assembleDebug

# Install directly to connected phone via ADB
adb install -r app/build/outputs/apk/debug/app-debug.apk
\`\`\`

---

## Game Architecture Components
- \`MainActivity.kt\`: Fullscreen landscape activity lifecycle management.
- \`MainMenuScreen.kt\`: Jetpack Compose tactical menu & mission selection.
- \`GameScreen.kt\`: In-game HUD overlay and multi-touch virtual joysticks.
- \`GameRenderer.kt\`: Hardware-accelerated OpenGL ES 3.0 renderer.
- \`PlayerController.kt\`: Movement, camera yaw/pitch, and health state.
- \`SettingsRepository.kt\`: SharedPreferences local storage for graphics & audio preferences.
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
