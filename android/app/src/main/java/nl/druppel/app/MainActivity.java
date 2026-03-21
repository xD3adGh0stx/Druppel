package nl.druppel.app;

import android.os.Build;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        // Disable Android's automatic Force Dark so our app controls its own dark mode
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.getSettings().setAlgorithmicDarkeningAllowed(false);
            }
        }
    }
}
