import http from 'k6/http';
import { sleep } from 'k6';
export let options = { vus: 1000, duration: '3m' };
export default function () {
  http.get('http://localhost:5000/api/dashboard/stats');
  sleep(1);
}
