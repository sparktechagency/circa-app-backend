import * as fs from "fs";
import * as path from "path";
import yaml from "js-yaml";

const APP_MODULES_PATH = path.join(process.cwd(), "src", "app", "modules");
const DOCKER_COMPOSE_PATH = path.join(process.cwd(), "docker-compose.app.yaml");
const KONG_YAML_PATH = path.join(process.cwd(), "kong.yaml");

async function generateDockerAndKongServices() {
  // 1️⃣ Read modules folder
  const modules = fs.readdirSync(APP_MODULES_PATH, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  // 2️⃣ Load existing docker-compose.app.yaml
  let dockerCompose: any = { version: "3.9", services: {}, networks: { "template-network": { external: true } } };
  if (fs.existsSync(DOCKER_COMPOSE_PATH)) {
    dockerCompose = yaml.load(fs.readFileSync(DOCKER_COMPOSE_PATH, "utf8")) || dockerCompose;
  }

  // 3️⃣ Load existing kong.yaml
  let kongConfig: any = { _format_version: "3.0", services: [] };
  if (fs.existsSync(KONG_YAML_PATH)) {
    kongConfig = yaml.load(fs.readFileSync(KONG_YAML_PATH, "utf8")) || kongConfig;
  }

  // 4️⃣ For each module, add docker service and kong service if not exist
  modules.forEach(moduleName => {
    if(moduleName === "resetToken") return;
    
    const serviceName = `${moduleName}-service`.toLowerCase();
    const modulePort = 5000 + Math.floor(Math.random() * 1000); // dynamic port, just example

    // Docker service
    if (!dockerCompose.services[serviceName]) {
      dockerCompose.services[serviceName] = {
        build: ".",
        ports: [`${modulePort}:${modulePort}`],
        environment: [
          `PORT=${modulePort}`,
          `DATABASE_URL=mongodb://mongo:27017/embay`,
          `BACKUP_DATABASE_URL=mongodb://mongo:27017/embay`,
          `REDIS_HOST=redis`,
          `REDIS_PORT=6379`,
          `KAFKA_URL=kafka:9092`,
          `ELASTICSEARCH_URL=http://elasticsearch:9200`,
        ],
        networks: ["template-network"],
        depends_on: ["kong"],
        volumes: ["shared-data:/app/uploads"],
      };
      console.log(`Added Docker service: ${serviceName} (port ${modulePort})`);
    }

    // Kong service
    if (!kongConfig.services.find((s: any) => s.name === serviceName)) {
      kongConfig.services.push({
        name: serviceName,
        url: `http://${serviceName}:${modulePort}/api/v1/${moduleName}`,
        routes: [
          {
            name: `${moduleName}-route`,
            paths: [`/api/v1/${moduleName}`],
          },
        ],
      });
      console.log(`Added Kong service: ${serviceName}`);
    }
  });

  // 5️⃣ Write updated docker-compose.app.yaml
  fs.writeFileSync(DOCKER_COMPOSE_PATH, yaml.dump(dockerCompose), "utf8");

  // 6️⃣ Write updated kong.yaml
  fs.writeFileSync(KONG_YAML_PATH, yaml.dump(kongConfig), "utf8");

  console.log("Docker Compose and Kong config updated successfully!");
}

// Run
generateDockerAndKongServices().catch(console.error);
