package prebuilt

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func get(t *testing.T, h http.Handler, path string) (int, string) {
	t.Helper()
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequestWithContext(t.Context(), http.MethodGet, path, nil))
	body, _ := io.ReadAll(rec.Result().Body)
	return rec.Code, string(body)
}

// TestServesTheClient covers mounting under /client the way the runner does:
// the directory serves index.html, the files it references are there, and a
// missing file is not found.
func TestServesTheClient(t *testing.T) {
	h := http.StripPrefix("/client", Handler())

	status, index := get(t, h, "/client/")
	if status != http.StatusOK || !strings.Contains(index, "<html") {
		t.Fatalf("/client/ = %d", status)
	}
	for _, ref := range []string{"/assets/", "favicon.svg"} {
		if !strings.Contains(index, ref) {
			t.Fatalf("index.html does not reference %s", ref)
		}
	}
	if status, _ := get(t, h, "/client/favicon.svg"); status != http.StatusOK {
		t.Fatalf("favicon = %d", status)
	}
	if status, _ := get(t, h, "/client/missing.js"); status != http.StatusNotFound {
		t.Fatalf("missing file = %d, want 404", status)
	}
}
