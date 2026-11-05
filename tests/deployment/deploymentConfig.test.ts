import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Production Deployment Scaffolding', () => {
  it('should provide valid Dockerfile and docker-compose configurations', () => {
    const dockerfile = fs.readFileSync(path.join(process.cwd(), 'Dockerfile'), 'utf-8');
    expect(dockerfile).toContain('FROM node:');
    expect(dockerfile).toContain('npm run build');

    const compose = fs.readFileSync(path.join(process.cwd(), 'docker-compose.yml'), 'utf-8');
    expect(compose).toContain('services:');
    expect(compose).toContain('postgres:');
  });

  it('should provide Caddyfile with reverse proxy to Next.js app', () => {
    const caddyfile = fs.readFileSync(path.join(process.cwd(), 'Caddyfile'), 'utf-8');
    expect(caddyfile).toContain('reverse_proxy');
    expect(caddyfile).toContain('3000');
  });

  it('should provide complete DEPLOYMENT.md documentation guide', () => {
    const deploymentDoc = fs.readFileSync(path.join(process.cwd(), 'docs/DEPLOYMENT.md'), 'utf-8');
    expect(deploymentDoc).toContain('VPS');
    expect(deploymentDoc).toContain('Docker');
    expect(deploymentDoc).toContain('Caddy');
    expect(deploymentDoc).toContain('PostgreSQL');
  });
});
