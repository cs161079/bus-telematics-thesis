# 🚌 Τηλεματική ΟΑΣΑ – Server

Το παρόν project αποτελεί το **Πρακτικό μέρος** της διπλωματικής με θέμα **Τηλεματική Λεοφωρείων με Χρήση τεχνιτής νοημασύνης** .  
Σκοπός του είναι η συλλογή, επεξεργασία και διάθεση δεδομένων σε πραγματικό χρόνο που αφορούν:
- Θέσεις λεωφορείων
- Χρόνους αναμονής στις στάσεις
- Δρομολόγια και χρονοδιαγράμματα

---
## Admin Portal
Είναι μία Web Εφαρμογή με την οποία ο διαχειρηστής του οργανισμού μεταφορών μπορεί να δει πληροφορίες αλλά και να κάνει ενέργει εκ των οποίων είναι η αποστολή ειδοποιήσεων στους χειριστές της Mobile εφαρμογής αλλά και η προσθήκη ή μειώση δρομολογίου ανάλογα με τις προτάσεις του συστήματος.

Για την εκτέλεση της εφαρμογής
``` 
    npm install
    ng serve
```

## 📖 Περιεχόμενα
- [Περιγραφή](#-περιγραφή)
- [Τεχνολογίες](#-τεχνολογίες)
- [Προαπαιτούμενα](#-προαπαιτούμενα)
- [Εγκατάσταση](#-εγκατάσταση)
- [Χρήση](#-χρήση)
- [API](#-api)
- [Συνεισφορά](#-συνεισφορά)
- [Άδεια](#-άδεια)

---

## 🚀 Περιγραφή
Ο server λειτουργεί ως μεσολαβητής μεταξύ:
- Των συσκευών τηλεματικής στα οχήματα
- Της βάσης δεδομένων
- Των εφαρμογών/clients (mobile app, web app, APIs τρίτων)

Παρέχει RESTful API endpoints για άντληση πληροφορίας και δυνατότητες real-time streaming (π.χ. μέσω WebSocket).

---

## ⚙️ Τεχνολογίες
- **Backend:** GO
- **GronJob:** GO
- **Βάση Δεδομένων:** MySQL  
- **Επικοινωνία:** REST API  
- **Containerization:** Docker
- **Orchestration:** Kubernetes 

---

## 🛠 Προαπαιτούμενα
- Docker (προαιρετικά, για εύκολη εκτέλεση)
- Kubernetes 

---

## 📦 Εγκατάσταση
1. Κλωνοποίησε το αποθετήριο:
   ```bash
   git clone https://github.com/cs161079/monorepo.git
   cd monorepo
2. Build docker images:
    - Build docker image για την server εφαρμογή
    ```bash
    docker build -f docker/oasa-api.Dockerfile -t [registry-host[:port]/][namespace/]<repository-name>[:tag] .
    docker push
    ```
    - Build docker image για την Cronjob εφαρμογή
    ```bash
    docker build -f docker/oasa-job.Dockerfile -t [registry-host[:port]/][namespace/]<repository-name>[:tag] .
    docker push
    ```
    - Build docker image για την εφαρμογή OTP
    ```bash
    docker build -f docker/trip-planner-api.Dockerfile -t [registry-host[:port]/][namespace/]<repository-name>[:tag] .
    docker push
    ```
3. Deploy to Kubernetes Cluster

## Οδηγείες εγκατάστασης πιστοποιητικού Lets Encrypt στο Cluster
0) Προαπαιτούμενα (γρήγορος έλεγχος)
    - Έχεις Ingress Controller (nginx) με EXTERNAL-IP/hostname.
    - Το DNS του uat.osses.gr δείχνει στο LoadBalancer του ingress.
    - Namespace της εφαρμογής: oasa-telemat.
    - Service της εφαρμογής ακούει π.χ. στο 8080.
    - Για HTTP-01: η port 80 είναι ανοιχτή, χωρίς server-level redirect 80→443 στο /.well-known/acme-challenge/*.
1) Εγκατάσταση cert-manager (μία φορά στο cluster)
    ```bash
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.4/cert-manager.yaml
    kubectl -n cert-manager rollout status deploy/cert-manager
    ```
2) Δημιουργία ClusterIssuer
    - Επιλογή Α — ClusterIssuer με HTTP-01 (nginx ingress)

    ```yaml
    # cluster-issuer-http01.yaml
    apiVersion: cert-manager.io/v1
    kind: ClusterIssuer
    metadata:
    name: letsencrypt-prod
    spec:
    acme:
        email: cs161079@uniwa.gr
        server: https://acme-v02.api.letsencrypt.org/directory
        privateKeySecretRef:
        name: letsencrypt-prod-account-key
        solvers:
        - http01:
            ingress:
                class: nginx              # <-- Εναλλακτικά:
                # ingressClassName: nginx # (αν ο controller σου περιμένει αυτό)
    ```

    ```bash
    kubectl apply -f cluster-issuer-http01.yaml
    ```
    - Επιλογή Β — ClusterIssuer με DNS-01 (Cloudflare)
    1. Δημιούργησε Cloudflare API Token με Zone:Read και DNS:Edit (περιορισμένο στη ζώνη σου).
    2. Φτιάξε το Secret στο namespace cert-manager:
    ```bash
    kubectl -n cert-manager create secret generic cloudflare-api-token-secret \
    --from-literal=api-token='<CF_API_TOKEN>'
    ```
    3. Φτιάξε τον ClusterIssuer:
    ```yaml
    # cluster-issuer-dns01.yaml
    apiVersion: cert-manager.io/v1
    kind: ClusterIssuer
    metadata:
    name: letsencrypt-dns
    spec:
    acme:
        email: cs161079@uniwa.gr
        server: https://acme-v02.api.letsencrypt.org/directory
        privateKeySecretRef:
        name: letsencrypt-dns-account-key
        solvers:
        - selector:
            dnsZones:
                - "osses.gr"
            dns01:
            cloudflare:
                apiTokenSecretRef:
                name: cloudflare-api-token-secret
                key: api-token
            # cnameStrategy: Follow   # αν έχεις CNAME delegation για _acme-challenge
    ```

    ```bash
    kubectl apply -f cluster-issuer-dns01.yaml
    ```
3) Δημιουργία Certificate στο namespace της εφαρμογής

    **Για single host** (π.χ. uat.osses.gr)
    ```yaml
    # certificate.yaml
    apiVersion: cert-manager.io/v1
    kind: Certificate
    metadata:
    name: keycloak-tls
    namespace: oasa-telemat
    spec:
    secretName: keycloak-tls
    issuerRef:
        kind: ClusterIssuer
        name: letsencrypt-prod     # ή letsencrypt-dns αν πας με DNS-01
    dnsNames:
        - uat.osses.gr
    ```

    **Για wildcard (DNS-01 μόνο)**
    ```yaml
    # certificate-wildcard.yaml
    apiVersion: cert-manager.io/v1
    kind: Certificate
    metadata:
    name: wildcard-osses-gr
    namespace: oasa-telemat
    spec:
    secretName: wildcard-osses-gr
    issuerRef:
        kind: ClusterIssuer
        name: letsencrypt-dns
    dnsNames:
        - "*.osses.gr"
        - "osses.gr"       # προαιρετικό, για το root
    ```

    ```bash
    kubectl apply -f certificate.yaml          # ή certificate-wildcard.yaml
    ```
4) Ingress της εφαρμογής να χρησιμοποιεί το Secret
    ```yaml
    # ingress.yaml (παράδειγμα)
    apiVersion: networking.k8s.io/v1
    kind: Ingress
    metadata:
    name: keycloak
    namespace: oasa-telemat
    annotations:
        kubernetes.io/ingress.class: "nginx"             # ή spec.ingressClassName: nginx
        cert-manager.io/cluster-issuer: "letsencrypt-prod"  # μόνο αν ΘΕΛΕΙΣ ingress-shim
        nginx.ingress.kubernetes.io/ssl-redirect: "true" # ΟΧΙ server-level 308
    spec:
    tls:
        - hosts:
            - uat.osses.gr
        secretName: keycloak-tls                        # ίδιο με Certificate.spec.secretName
    rules:
        - host: uat.osses.gr
        http:
            paths:
            - path: /
                pathType: Prefix
                backend:
                service:
                    name: keycloak
                    port:
                    number: 8080
    ```

    > [!NOTE] 
    > Αν κρατάς ρητό Certificate, μπορείς να αφαιρέσεις το annotation cert-manager.io 
    cluster-issuer (για να μην δημιουργεί δεύτερο auto-Certificate).

5) Έλεγχοι / Παρακολούθηση

```bash
# Κατάσταση του Certificate
kubectl -n oasa-telemat describe certificate keycloak-tls
kubectl -n oasa-telemat get secret keycloak-tls

# ACME resources
kubectl -n oasa-telemat get certificaterequests.acme.cert-manager.io
kubectl -n oasa-telemat get orders.acme.cert-manager.io
kubectl -n oasa-telemat get challenges.acme.cert-manager.io -o wide

# Logs του cert-manager
kubectl -n cert-manager logs deploy/cert-manager --tail=200 -f
```

**HTTP-01 μόνο:**
- Επιβεβαίωσε ότι η 80 είναι ανοιχτή και δεν υπάρχει server-level redirect 80→443:
```bash
curl -v http://uat.osses.gr/.well-known/acme-challenge/test
```
(Κατά την έκδοση θα δεις προσωρινό solver Ingress cm-acme-http-solver-*.)

**Τελικός έλεγχος “live” cert:**
```bash
LB=$(kubectl -n ingress-nginx get svc ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
openssl s_client -servername uat.osses.gr -connect ${LB}:443 </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates
```

