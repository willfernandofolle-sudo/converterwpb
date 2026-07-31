import { useState } from "react";
import JSZip from "jszip";
import styled from "styled-components";
import { ZIP_MODULES, AUTO_INCLUDE_MODULES, buildDefaultModuleSelection } from "../config/zip-modules";

const TEXT_EXTENSIONS = [".html", ".css", ".js", ".json", ".txt", ".svg"];

const EXCLUDED_FILES = new Set(["404.html", "404.css"]);

const OPTIONAL_MODULE_ASSETS = {
  alarms: [
    {
      name: "active.webp",
      zipPath: "img/active.webp",
      urls: [
        "/images/active.webp",
        "https://raw.githubusercontent.com/williamfolle/teleportconvert/main/public/images/active.webp",
        "https://raw.githubusercontent.com/williamfolle/teleportconvert/master/public/images/active.webp",
      ],
    },
    {
      name: "inactive.webp",
      zipPath: "img/inactive.webp",
      urls: [
        "/images/inactive.webp",
        "https://raw.githubusercontent.com/williamfolle/teleportconvert/main/public/images/inactive.webp",
        "https://raw.githubusercontent.com/williamfolle/teleportconvert/master/public/images/inactive.webp",
      ],
    },
    {
      name: "resettable.webp",
      zipPath: "img/resettable.webp",
      urls: [
        "/images/resettable.webp",
        "https://raw.githubusercontent.com/williamfolle/teleportconvert/main/public/images/resettable.webp",
        "https://raw.githubusercontent.com/williamfolle/teleportconvert/master/public/images/resettable.webp",
      ],
    },
  ],
};

const Container = styled.div`
  max-width: 1200px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 28px 20px 40px;
  display: flex;
  align-items: center;
`;

const Grid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-areas:
    "hero hero hero hero hero hero hero hero hero hero hero hero"
    "desc desc desc desc desc desc desc desc modules modules modules modules"
    "status status status status status status status status upload upload upload upload";
  gap: 16px;
  grid-auto-rows: auto;
  align-items: stretch;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "hero"
      "desc"
      "modules"
      "upload"
      "status";
  }
`;

const Block = styled.section`
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgb(42, 42, 42);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.24);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Logo = styled.img`
  max-width: 300px;
  max-height: 120px;
  width: auto;
  height: auto;
  object-fit: contain;
`;

const HeroBlock = styled(Block)`
  grid-area: hero;
  min-height: 135px;
  position: relative;
  padding: 16px 20px;
  justify-content: center;
  align-items: center;
  background-image: url("/images/4.jpg");
  background-size: cover;
  background-position: center;
`;

const HeroContent = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
`;

const DescriptionBlock = styled(Block)`
  grid-area: desc;
  min-height: 240px;
  position: relative;
  padding: 18px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  background-image: url("/images/4.jpg");
  background-size: cover;
  background-position: center;
`;

const DescriptionPanel = styled.div`
  width: 100%;
  max-width: 780px;
  padding: 16px 18px;
  text-align: center;
`;

const DescriptionScheme = styled.img`
  width: 100%;
  max-width: 760px;
  max-height: 185px;
  object-fit: contain;
  margin-top: 12px;
`;

const DescriptionTitle = styled.h2`
  margin: 0;
  color: #ffffff;
  font-size: 1.28rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
`;

const DescriptionText = styled.p`
  margin: 0;
  color: #ffffff;
  line-height: 1.6;
  max-width: 760px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.65);
`;

const DescriptionSubtitle = styled.p`
  margin: 8px 0 0;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.35px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.65);
`;

const ModulesBlock = styled(Block)`
  grid-area: modules;
  padding: 18px;
  min-height: 240px;
  justify-content: flex-start;
`;

const ModulesPanel = styled.div`
  width: 100%;
  padding: 14px;
`;

const UploadBlock = styled(Block)`
  grid-area: upload;
  padding: 18px;
  min-height: 240px;
  justify-content: flex-start;
  gap: 12px;
`;

const StatusBlock = styled(Block)`
  grid-area: status;
  padding: 18px;
  min-height: 240px;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const FileInput = styled.input`
  width: 100%;
  color: #ffffff;
  background: rgba(26, 26, 26, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  padding: 11px;
`;

const SectionTitle = styled.h2`
  color: #ffffff;
  margin: 0;
  font-size: 1.16rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.35px;
  text-align: center;
  width: 100%;
`;

const OptionList = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 16px;
`;

const OptionCard = styled.label`
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 10px;
  align-items: start;
  padding: 10px 12px;
  background: rgba(26, 26, 26, 0.74);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
`;

const OptionName = styled.span`
  color: #ffffff;
  font-weight: 600;
`;

const OptionDescription = styled.span`
  display: block;
  color: #ffffff;
  margin-top: 2px;
  font-size: 0.92rem;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  margin-top: 2px;
`;

const Button = styled.button`
  background-color: ${(props) => props.theme.colors.primary};
  border: none;
  color: white;
  padding: 14px 18px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.25px;
  cursor: pointer;
  transition: background-color 0.25s, transform 0.25s;
  border-radius: 10px;

  &:hover {
    background-color: ${(props) => props.theme.colors.secondary};
    transform: translateY(-1px);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.p`
  text-align: center;
  color: ${(props) => (props.error ? "#ff6b6b" : "#ffffff")};
  font-weight: bold;
  margin: 0;
`;

const StatusTitle = styled.h2`
  margin: 0;
  color: #ffffff;
  font-size: 1.16rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.35px;
  text-align: center;
`;

const StatusHint = styled.p`
  margin: 0;
  color: #ffffff;
  font-size: 0.92rem;
  text-align: center;
`;

const MutedText = styled.p`
  margin: 0;
  color: #ffffff;
  font-size: 0.92rem;
  text-align: center;
  width: 100%;
`;

const Divider = styled.div`
  height: 1px;
  width: 100%;
  background: rgba(255, 255, 255, 0.14);
`;

async function fetchFileWithFallback(urls, fileName) {
  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed ${response.status} on ${url}`);
      }
      return await response.text();
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Unable to fetch ${fileName}: ${lastError?.message || "unknown error"}`);
}

async function fetchBinaryFileWithFallback(urls, fileName) {
  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed ${response.status} on ${url}`);
      }
      return await response.arrayBuffer();
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Unable to fetch ${fileName}: ${lastError?.message || "unknown error"}`);
}

function isTextFile(filePath) {
  return TEXT_EXTENSIONS.some((extension) => filePath.toLowerCase().endsWith(extension));
}

function isExcludedFile(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  const fileName = normalized.split("/").pop()?.toLowerCase();
  return EXCLUDED_FILES.has(fileName);
}

function removeExternalFontLinksFromHtml(htmlContent) {
  return htmlContent.replace(
    /<link\b[^>]*href=["'][^"']*fonts\.googleapis\.com[^"']*["'][^>]*>\s*/gi,
    ""
  );
}

function addEnterKeyHintToTextInputs(htmlContent) {
  // Adiciona enterkeyhint="done" a todos os inputs type="text" que não têm esse atributo
  htmlContent = htmlContent.replace(
    /<input\s+([^>]*?\s+)?type=["']?text["']?(\s+[^>]*)?>/gi,
    (match) => {
      // Verifica se já tem enterkeyhint
      if (match.includes('enterkeyhint')) {
        return match;
      }
      // Adiciona enterkeyhint="done" antes do fechamento da tag
      return match.replace(/\s*>$/, ' enterkeyhint="done">');
    }
  );

  return htmlContent;
}

function injectScriptsAndStylesIntoHtml(htmlContent, selectedModules) {
  // Injetar CSS no head (antes de </head>)
  const cssLink = '<link rel="stylesheet" type="text/css" href="../style/common.css">';
  const customCode3Css = '<!-- custom code 3 -->\n  ' + cssLink;

  if (!htmlContent.includes('common.css')) {
    htmlContent = htmlContent.replace('</head>', customCode3Css + '\n</head>');
  }

  // Injetar scripts no body (antes de </body>)
  if (!htmlContent.includes('LLWebServerExtended.js')) {
    const scripts = [];

    // Custom code 1 - LLWebServerExtended.js
    scripts.push('<!-- custom code 1 -->\n  <script type="text/javascript" src="LLWebServerExtended.js"></script>');

    // Custom code 2 - base.js
    scripts.push('<!-- custom code 2 -->\n  <script type="text/javascript" src="../js/base.js"></script>');

    // Módulos opcionais selecionados
    ZIP_MODULES.forEach(module => {
      if (selectedModules[module.id]) {
        const moduleName = module.name;
        scripts.push(`<!-- ${module.label} code -->\n  <script type="text/javascript" src="${moduleName}"></script>`);
      }
    });

    // Custom code 3 - AutoRefreshStart e outras funções
    const autoRefreshScript = `<!-- custom code 3 -->\n  <script type="text/javascript">\n    LLWebServer.AutoRefreshStart(2000);\n    showLoginStatus();\n    localStorage.setItem("showNeutralNavbar", true);\n  </script>`;
    scripts.push(autoRefreshScript);

    const scriptTags = scripts.join('\n');

    htmlContent = htmlContent.replace('</body>', scriptTags + '\n</body>');
  }

  return htmlContent;
}

export default function Home() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [selectedModules, setSelectedModules] = useState(buildDefaultModuleSelection);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus("");
  };

  const handleModuleToggle = (moduleId) => {
    setSelectedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setProcessing(true);
    setStatus("Processing...");

    const zip = new JSZip();
    const newZip = new JSZip();

    try {
      const content = await zip.loadAsync(file);

      let excludedFilesCount = 0;
      for (const [path, zipEntry] of Object.entries(content.files)) {
        const excludedFile = isExcludedFile(path);
        let newPath = path;

        if (!excludedFile) {
          newPath = path.includes("public/") ? path.replace("public/", "img/") : path;
        }

        if (zipEntry.dir) {
          newZip.folder(newPath);
          continue;
        }

        if (excludedFile) {
          excludedFilesCount += 1;
          continue;
        }

        if (isTextFile(path)) {
          let fileContent = await zipEntry.async("string");
          fileContent = fileContent.replace(/public\//g, "img/");
          fileContent = fileContent.replace(/public%2F/g, "img%2F");
          if (path.toLowerCase().endsWith(".html")) {
            fileContent = removeExternalFontLinksFromHtml(fileContent);
            fileContent = addEnterKeyHintToTextInputs(fileContent);
            fileContent = injectScriptsAndStylesIntoHtml(fileContent, selectedModules);
          }
          newZip.file(newPath, fileContent);
        } else {
          const binaryFile = await zipEntry.async("uint8array");
          newZip.file(newPath, binaryFile);
        }
      }

      const filesToAdd = ZIP_MODULES.filter((module) => selectedModules[module.id]);
      const allFilesToAdd = [...AUTO_INCLUDE_MODULES, ...filesToAdd];

      for (const fileToAdd of allFilesToAdd) {
        try {
          const fetchedContent = await fetchFileWithFallback(fileToAdd.urls, fileToAdd.name);
          newZip.file(fileToAdd.name, fetchedContent);
        } catch (error) {
          console.error("Error fetching file:", error);
          setStatus(`Error fetching ${fileToAdd.name}`);
          setProcessing(false);
          return;
        }
      }

      const assetFilesToAdd = filesToAdd.flatMap((module) => OPTIONAL_MODULE_ASSETS[module.id] || []);

      for (const assetToAdd of assetFilesToAdd) {
        try {
          const fetchedBinary = await fetchBinaryFileWithFallback(assetToAdd.urls, assetToAdd.name);
          newZip.file(assetToAdd.zipPath, fetchedBinary);
        } catch (error) {
          console.error("Error fetching asset file:", error);
          setStatus(`Error fetching ${assetToAdd.name}`);
          setProcessing(false);
          return;
        }
      }

      // Generate and download ZIP
      const blob = await newZip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "website.zip";
      a.click();
      window.URL.revokeObjectURL(url);

      setStatus(
        `ZIP processed successfully. Extra files: ${filesToAdd.length}. 404 files removed: ${excludedFilesCount}.`
      );
    } catch (error) {
      console.error("Error processing ZIP:", error);
      setStatus("Error processing ZIP file. Please try again.");
    }

    setProcessing(false);
  };

  const hasError = status.toLowerCase().includes("error");
  const statusText = status || "Awaiting ZIP upload to start conversion.";

  return (
    <Container>
      <Grid>
        <HeroBlock>
          <HeroContent>
            <Logo src="/images/5.png" alt="Tool Logo" />
          </HeroContent>
        </HeroBlock>

        <DescriptionBlock>
          <DescriptionPanel>
            <DescriptionTitle>web page builder converter for tm172 sip/sig</DescriptionTitle>
            <DescriptionSubtitle>By HVAC Application Expert Center V 1.0.0</DescriptionSubtitle>
            <DescriptionScheme src="/images/7.png" alt="Feature scheme" />
          </DescriptionPanel>
        </DescriptionBlock>

        <ModulesBlock>
          <ModulesPanel>
            <SectionTitle>Optional Modules</SectionTitle>
            <Divider />
            <OptionList>
              {ZIP_MODULES.map((module) => (
                <OptionCard key={module.id}>
                  <Checkbox
                    type="checkbox"
                    checked={selectedModules[module.id]}
                    onChange={() => handleModuleToggle(module.id)}
                  />
                  <span>
                    <OptionName>{module.label}</OptionName>
                    {module.description ? (
                      <OptionDescription>{module.description}</OptionDescription>
                    ) : null}
                  </span>
                </OptionCard>
              ))}
            </OptionList>
          </ModulesPanel>
        </ModulesBlock>

        <StatusBlock>
          <StatusTitle>Conversion Status</StatusTitle>
          <StatusHint>Dynamic message of processing success or error.</StatusHint>
          <StatusMessage error={hasError}>{statusText}</StatusMessage>
        </StatusBlock>

        <UploadBlock>
          <Form onSubmit={handleSubmit}>
            <SectionTitle>ZIP Upload</SectionTitle>
            <MutedText>Select a ZIP file and start the conversion process.</MutedText>
            <FileInput type="file" accept=".zip" onChange={handleFileChange} />
            <Button type="submit" disabled={!file || processing}>
              {processing ? "Processing..." : "Process ZIP"}
            </Button>
          </Form>
        </UploadBlock>
      </Grid>
    </Container>
  );
}