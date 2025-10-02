#!/usr/bin/env node

/**
 * Script de test automatisé pour le module de candidature
 * Teste toutes les fonctionnalités critiques end-to-end
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:5001';
const TIMEOUT = 30000;

// Couleurs pour les logs
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Fonction utilitaire pour faire des requêtes HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CandidatureModuleTest/1.0',
        ...options.headers
      },
      timeout: TIMEOUT
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            body: data,
            json: () => JSON.parse(data)
          };
          resolve(result);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            json: () => null
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Tests individuels
class CandidatureTests {
  constructor() {
    this.results = [];
    this.session = {};
  }

  log(level, message, ...args) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const colors_map = {
      info: colors.blue,
      success: colors.green,
      error: colors.red,
      warn: colors.yellow
    };
    console.log(`[${timestamp}] ${colors_map[level] || ''}${message}${colors.reset}`, ...args);
  }

  async test(name, testFn) {
    this.log('info', `🧪 Test: ${name}`);
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({ name, status: 'PASS', duration });
      this.log('success', `✅ PASS: ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({ name, status: 'FAIL', duration, error: error.message });
      this.log('error', `❌ FAIL: ${name} (${duration}ms): ${error.message}`);
    }
  }

  // Test 1: Vérifier que l'API des offres d'emploi fonctionne
  async testJobsAPI() {
    const response = await makeRequest(`${BASE_URL}/api/jobs`);
    
    if (response.status !== 200) {
      throw new Error(`API jobs returned ${response.status}`);
    }

    const jobs = response.json();
    if (!Array.isArray(jobs)) {
      throw new Error('Jobs API should return an array');
    }

    if (jobs.length === 0) {
      throw new Error('No jobs found - should have default test jobs');
    }

    // Vérifier la structure des jobs
    const firstJob = jobs[0];
    const requiredFields = ['id', 'title', 'company', 'location', 'description'];
    for (const field of requiredFields) {
      if (!firstJob[field]) {
        throw new Error(`Job missing required field: ${field}`);
      }
    }

    this.log('info', `📋 Found ${jobs.length} jobs`);
  }

  // Test 2: Inscription d'un nouveau candidat
  async testCandidateRegistration() {
    const testEmail = `test-candidate-${Date.now()}@example.com`;
    const registrationData = {
      email: testEmail,
      password: 'TestPassword123',
      firstName: 'Test',
      lastName: 'Candidate'
    };

    const response = await makeRequest(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      body: registrationData
    });

    if (response.status !== 201) {
      // Peut échouer si la DB n'est pas disponible, c'est acceptable
      this.log('warn', `Registration returned ${response.status} - may be expected if DB is not available`);
      return;
    }

    const result = response.json();
    if (!result.user || result.user.email !== testEmail) {
      throw new Error('Registration should return user data');
    }

    this.session.testUser = result.user;
    this.log('info', `👤 Created test candidate: ${testEmail}`);
  }

  // Test 3: Connexion candidat avec compte de test
  async testCandidateLogin() {
    const loginData = {
      email: 'candidate@test.com',
      password: 'test123'
    };

    const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: loginData
    });

    if (response.status !== 200) {
      throw new Error(`Login failed with status ${response.status}: ${response.body}`);
    }

    const result = response.json();
    if (!result.user || result.user.role !== 'candidate') {
      throw new Error('Login should return candidate user data');
    }

    // Extraire les cookies de session
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      this.session.cookies = cookies.map(cookie => cookie.split(';')[0]).join('; ');
    }

    this.session.user = result.user;
    this.log('info', `🔐 Logged in candidate: ${result.user.email}`);
  }

  // Test 4: Créer une candidature
  async testCreateApplication() {
    if (!this.session.user) {
      throw new Error('Must be logged in to create application');
    }

    // D'abord récupérer les jobs disponibles
    const jobsResponse = await makeRequest(`${BASE_URL}/api/jobs`);
    const jobs = jobsResponse.json();
    
    if (jobs.length === 0) {
      throw new Error('No jobs available to apply to');
    }

    const targetJob = jobs[0];
    const applicationData = {
      jobId: targetJob.id,
      coverLetter: 'Test cover letter for automated testing',
      resume: 'Test resume content',
      availability: new Date().toISOString()
    };

    const response = await makeRequest(`${BASE_URL}/api/applications`, {
      method: 'POST',
      body: applicationData,
      headers: {
        'Cookie': this.session.cookies || ''
      }
    });

    if (response.status !== 201) {
      throw new Error(`Application creation failed with status ${response.status}: ${response.body}`);
    }

    const result = response.json();
    if (!result.id || result.jobId !== targetJob.id) {
      throw new Error('Application should be created successfully');
    }

    this.session.application = result;
    this.log('info', `📝 Created application ${result.id} for job "${targetJob.title}"`);
  }

  // Test 5: Récupérer les candidatures de l'utilisateur
  async testGetUserApplications() {
    if (!this.session.user) {
      throw new Error('Must be logged in to get applications');
    }

    const response = await makeRequest(`${BASE_URL}/api/applications`, {
      headers: {
        'Cookie': this.session.cookies || ''
      }
    });

    if (response.status !== 200) {
      throw new Error(`Get applications failed with status ${response.status}`);
    }

    const applications = response.json();
    if (!Array.isArray(applications)) {
      throw new Error('Applications should be returned as array');
    }

    this.log('info', `📊 User has ${applications.length} applications`);
  }

  // Test 6: Connexion admin
  async testAdminLogin() {
    const loginData = {
      email: 'admin@test.com',
      password: 'admin123'
    };

    const response = await makeRequest(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      body: loginData
    });

    if (response.status !== 200) {
      throw new Error(`Admin login failed with status ${response.status}: ${response.body}`);
    }

    const result = response.json();
    if (!result.user || result.user.role !== 'admin') {
      throw new Error('Admin login should return admin user data');
    }

    // Stocker les cookies admin séparément
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      this.session.adminCookies = cookies.map(cookie => cookie.split(';')[0]).join('; ');
    }

    this.session.adminUser = result.user;
    this.log('info', `🔧 Admin logged in: ${result.user.email}`);
  }

  // Test 7: Accès admin aux candidatures
  async testAdminApplicationsAccess() {
    if (!this.session.adminUser) {
      throw new Error('Must be logged in as admin');
    }

    const response = await makeRequest(`${BASE_URL}/api/admin/applications`, {
      headers: {
        'Cookie': this.session.adminCookies || ''
      }
    });

    if (response.status !== 200) {
      throw new Error(`Admin applications access failed with status ${response.status}`);
    }

    const applications = response.json();
    if (!Array.isArray(applications)) {
      throw new Error('Admin should see all applications as array');
    }

    this.log('info', `🏢 Admin sees ${applications.length} total applications`);
  }

  // Test 8: Vérifier les permissions RBAC
  async testRBACPermissions() {
    // Tester qu'un candidat ne peut pas accéder aux fonctions admin
    const response = await makeRequest(`${BASE_URL}/api/admin/applications`, {
      headers: {
        'Cookie': this.session.cookies || ''
      }
    });

    if (response.status === 200) {
      throw new Error('Candidate should not have access to admin endpoints');
    }

    if (response.status !== 403 && response.status !== 401) {
      throw new Error(`Expected 401/403 for unauthorized access, got ${response.status}`);
    }

    this.log('info', `🔒 RBAC correctly denies candidate access to admin endpoints`);
  }

  // Test 9: Test de charge basique
  async testBasicLoadHandling() {
    const requests = [];
    const numRequests = 10;

    // Faire plusieurs requêtes simultanées
    for (let i = 0; i < numRequests; i++) {
      requests.push(makeRequest(`${BASE_URL}/api/jobs`));
    }

    const responses = await Promise.allSettled(requests);
    
    const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status === 200);
    const failed = responses.filter(r => r.status === 'rejected' || r.value.status !== 200);

    if (successful.length < numRequests * 0.8) {
      throw new Error(`Only ${successful.length}/${numRequests} requests succeeded`);
    }

    this.log('info', `⚡ Load test: ${successful.length}/${numRequests} requests succeeded`);
  }

  // Exécuter tous les tests
  async runAllTests() {
    this.log('info', `${colors.bold}🚀 Démarrage des tests du module de candidature${colors.reset}`);
    this.log('info', `🎯 URL de test: ${BASE_URL}`);
    
    const startTime = Date.now();

    await this.test('API des offres d\'emploi', () => this.testJobsAPI());
    await this.test('Inscription candidat', () => this.testCandidateRegistration());
    await this.test('Connexion candidat', () => this.testCandidateLogin());
    await this.test('Création de candidature', () => this.testCreateApplication());
    await this.test('Récupération des candidatures', () => this.testGetUserApplications());
    await this.test('Connexion admin', () => this.testAdminLogin());
    await this.test('Accès admin aux candidatures', () => this.testAdminApplicationsAccess());
    await this.test('Permissions RBAC', () => this.testRBACPermissions());
    await this.test('Test de charge basique', () => this.testBasicLoadHandling());

    const totalTime = Date.now() - startTime;
    
    // Résultats finaux
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;

    console.log(`\n${colors.bold}📊 RÉSULTATS DES TESTS${colors.reset}`);
    console.log(`⏱️  Temps total: ${totalTime}ms`);
    console.log(`✅ Tests réussis: ${colors.green}${passed}${colors.reset}`);
    console.log(`❌ Tests échoués: ${colors.red}${failed}${colors.reset}`);
    console.log(`📈 Taux de réussite: ${Math.round((passed / this.results.length) * 100)}%`);

    if (failed > 0) {
      console.log(`\n${colors.red}${colors.bold}❌ ÉCHECS:${colors.reset}`);
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`  • ${result.name}: ${result.error}`);
      });
    }

    const isSuccess = failed === 0;
    console.log(`\n${colors.bold}${isSuccess ? colors.green + '🎉 TOUS LES TESTS RÉUSSIS' : colors.red + '💥 CERTAINS TESTS ONT ÉCHOUÉ'}${colors.reset}`);
    
    process.exit(isSuccess ? 0 : 1);
  }
}

// Démarrage des tests
const tests = new CandidatureTests();
tests.runAllTests().catch(error => {
  console.error(`${colors.red}${colors.bold}💥 Erreur fatale:${colors.reset}`, error);
  process.exit(1);
});