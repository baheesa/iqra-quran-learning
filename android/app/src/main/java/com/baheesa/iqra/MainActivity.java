package com.baheesa.iqra;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        hideSystemUI();

        webView = findViewById(R.id.webview);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                // Remove the AndroidDevice phone-frame wrapper; promote the inner app div to full-screen
                view.evaluateJavascript(
                    "(function() {" +
                    "  var body = document.body;" +
                    // Find the outer flex container (min-height:100vh wrapper)
                    "  var outer = body.querySelector('div[style*=\"min-height:100vh\"]') || body.querySelector('div[style*=\"min-height: 100vh\"]');" +
                    // Find the inner app div (height:100%, the real app content)
                    "  var inner = body.querySelector('div[style*=\"height:100%\"][style*=\"position:relative\"]') || body.querySelector('div[style*=\"height: 100%\"][style*=\"position: relative\"]');" +
                    "  if (inner) {" +
                    "    inner.style.cssText = 'position:fixed;inset:0;overflow:hidden;background:inherit;color:inherit;font-family:inherit;';" +
                    "    body.innerHTML = '';" +
                    "    body.appendChild(inner);" +
                    "  }" +
                    "  document.body.style.cssText = 'margin:0;padding:0;overflow:hidden;width:100%;height:100%;';" +
                    "})();",
                    null
                );
            }
        });
        webView.loadUrl("https://iqra-quran-learning-eight.vercel.app");
    }

    private void hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN |
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            );
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUI();
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
