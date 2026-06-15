# ETL Runner

O runner processa a fila PostgreSQL `etl_jobs`. A aplicação web apenas cria e
consulta jobs; os scripts Python são executados em um serviço persistente.

## Execução local

```powershell
.\.venv\Scripts\python.exe etl\runner.py --once
```

## Container

```bash
docker build -f Dockerfile.etl -t meus-politicos-etl .
docker run --rm --env-file app/.env.local meus-politicos-etl
```

Variáveis obrigatórias:

- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `PORTAL_TRANSPARENCIA_API_KEY`

O serviço não expõe porta HTTP. Ele consulta a fila a cada 10 segundos e
executa somente fontes registradas em `etl/runner.py`.
