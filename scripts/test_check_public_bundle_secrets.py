import tempfile
import unittest
import zipfile
from pathlib import Path

from check_public_bundle_secrets import scan_targets


class PublicArtifactSecretScannerTests(unittest.TestCase):
    def test_detects_provider_variable_names_without_printing_values(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "client.js"
            source.write_text('const key = "GEMINI_API_KEY=not-a-real-key";', encoding="utf-8")

            findings = scan_targets([source])

            self.assertEqual(findings, [(source.as_posix(), "provider-key variable name")])
            self.assertNotIn("not-a-real-key", repr(findings))

    def test_detects_google_and_openai_key_shapes_in_zip_members(self):
        with tempfile.TemporaryDirectory() as directory:
            archive_path = Path(directory) / "extension.zip"
            with zipfile.ZipFile(archive_path, "w") as archive:
                archive.writestr("google.js", "const key = 'AIza" + "A" * 35 + "';")
                archive.writestr("openai.js", "const key = 'sk-" + "B" * 28 + "';")

            findings = scan_targets([archive_path])

            self.assertEqual(
                findings,
                [
                    (f"{archive_path.as_posix()}:google.js", "Google API key shape"),
                    (f"{archive_path.as_posix()}:openai.js", "OpenAI API key shape"),
                ],
            )

    def test_allows_safe_environment_placeholders(self):
        with tempfile.TemporaryDirectory() as directory:
            example = Path(directory) / ".env.example"
            example.write_text("VITE_API_URL=http://localhost:5000/api/v1\n", encoding="utf-8")

            self.assertEqual(scan_targets([example]), [])


if __name__ == "__main__":
    unittest.main()
