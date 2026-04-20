# Troubleshooting Guide

รวม Error ที่พบบ่อยใน Lab พร้อมวิธีแก้ไขแบบ step-by-step

---

## 1. ErrImagePull / ImagePullBackOff

**อาการ:** `kubectl get pods` แสดงสถานะ `ErrImagePull` หรือ `ImagePullBackOff`

**สาเหตุและวิธีแก้:**

```bash
# ดู error message ละเอียด
kubectl describe pod <pod-name>
```

| สาเหตุ | วิธีแก้ |
|--------|---------|
| ชื่อ image ผิด | แก้ `image:` ใน api-deployment.yaml ให้ตรงกับ Docker Hub |
| Image ยังไม่ได้ push | รัน `docker push <username>/go-api:latest` |
| Docker Hub rate limit | ใช้ `docker login` ก่อน หรือรอ 1 ชั่วโมง |
| Private repo ไม่มี Secret | สร้าง `imagePullSecret` ใน K8s |

---

## 2. CrashLoopBackOff

**อาการ:** Pod restart ซ้ำๆ สถานะ `CrashLoopBackOff`

```bash
# ดู log ของ container ที่ crash
kubectl logs <pod-name> --previous

# ดูรายละเอียด event
kubectl describe pod <pod-name>
```

**สาเหตุที่พบบ่อย:**

| สาเหตุ | วิธีแก้ |
|--------|---------|
| ต่อ DB ไม่ได้ | ตรวจ `db-service` รันอยู่ไหม: `kubectl get svc` |
| Environment variable ผิด | ตรวจ Secret name/key ใน yaml |
| Port ผิด | ตรวจว่า container ฟังบนพอร์ตตรงกับ `containerPort` |
| Binary build ผิด arch | Build ด้วย `GOARCH=amd64 GOOS=linux` |

---

## 3. Pod ค้างที่ Pending

**อาการ:** Pod สถานะ `Pending` ไม่เปลี่ยน

```bash
kubectl describe pod <pod-name>
# ดู section "Events" ท้ายสุด
```

| สาเหตุ | วิธีแก้ |
|--------|---------|
| ไม่มี Node รับงาน | `kubectl get nodes` – ถ้า NotReady ให้ restart minikube |
| Resource ไม่พอ | ลด `resources.requests` ใน yaml |
| PVC ไม่ได้ Bound | `kubectl get pvc` – ถ้า Pending ให้ตรวจ StorageClass |

---

## 4. Service ไม่สามารถ Reach ได้

**อาการ:** `curl` ไปที่ NodePort แล้ว Connection refused / timeout

```bash
# ตรวจ Endpoint ว่า Pod ถูก register ไหม
kubectl get endpoints go-api-service

# รับ URL จาก minikube โดยตรง
minikube service go-api-service --url
```

---

## 5. GitHub Actions Runner ไม่ทำงาน

**อาการ:** Workflow รอ Runner นานมาก หรือ Job ไม่เริ่ม

```bash
# ตรวจสถานะ runner process
cd ~/actions-runner && ./run.sh &

# ตรวจว่า Runner online ใน GitHub
# Settings → Actions → Runners
```

**ข้อควรระวัง:** Runner ต้องรันอยู่ตลอดเวลาที่ใช้ Lab  
ใช้ `tmux` หรือ `nohup ./run.sh &` เพื่อให้ทำงาน background

---

## 6. kubectl: connection refused

**อาการ:** `kubectl get nodes` ตอบ `connection refused`

```bash
# Minikube อาจหยุดทำงาน
minikube status
minikube start --driver=docker

# ตรวจ context
kubectl config current-context
kubectl config use-context minikube
```

---

## 7. Prometheus ไม่ Scrape Metrics

**อาการ:** ไม่เห็น metric `http_requests_total` ใน Prometheus UI

```bash
# ตรวจว่า Pod มี annotation ครบ
kubectl get pod <api-pod> -o yaml | grep prometheus

# Port-forward เข้า Prometheus แล้วเปิด /targets
kubectl port-forward svc/prometheus-service 9090:9090
# เปิด http://localhost:9090/targets
```

---

## 8. Grafana Login ไม่ได้

ค่า default: **admin / admin123**  
ถ้า login แล้วถูกบังคับเปลี่ยน password ให้ใช้ password ใหม่นั้น

---

## คำสั่งด่วน (Quick Reference)

```bash
# ดู Pod ทั้งหมดพร้อม status
kubectl get pods -A

# ดู log แบบ real-time
kubectl logs -f deployment/go-api

# Restart deployment
kubectl rollout restart deployment/go-api

# ลบ Pod ให้มันสร้างใหม่
kubectl delete pod <pod-name>

# ดู resource usage
kubectl top pods

# เข้าไปใน container (debug)
kubectl exec -it <pod-name> -- sh
```
