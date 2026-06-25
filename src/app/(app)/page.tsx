export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Gestão Financeira Idealogic</h1>
      <p className="text-muted">
        Orçamento 2026 — selecione uma área no menu.
      </p>
      <ul className="space-y-1">
        <li>
          <a className="text-foreground underline" href="/orcamento">Orçamentação</a>
        </li>
        <li>
          <a className="text-foreground underline" href="/execucao">Execução Orçamentária</a>
        </li>
      </ul>
    </div>
  )
}
