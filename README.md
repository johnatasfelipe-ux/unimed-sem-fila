# Sem Fila — Protótipo v3

Esta versão foi adaptada para simular a inclusão do **Agendamento Online** diretamente no carrossel da home atual da Unimed Divinópolis.

## Páginas

- `index.html` — mock da home com o novo slide “Agora você pode agendar seu atendimento online” inserido no carrossel.
- `agendamento.html` — fluxo completo do beneficiário.
- `painel.html` — painel de indicadores para o responsável pelo atendimento.

## Alterações desta versão

1. Novo slide de chamada no carrossel da home.
2. Pergunta inicial: “Este agendamento é para você ou outra pessoa?”.
3. Identificação por **Carteirinha + nascimento** ou **CPF + nascimento**.
4. Remoção do campo “Nome completo”. Em uma solução real, o nome viria do cadastro após validação.
5. Segunda via de boleto retirada dos motivos de agendamento; o protótipo orienta a utilizar a IVA.
6. Negociação financeira exige informar previamente a preferência entre **Boleto** e **Cartão**.
7. Agenda com próximos dias úteis e horários de 40 em 40 minutos, mostrando disponíveis e ocupados.
8. Aviso e regra de cancelamento com antecedência mínima de **2 horas**.
9. Painel gestor com ocupação, faltas, cancelamentos, duração média, demanda por setor, horários de pico, preferência de pagamento e agendamentos para si/outra pessoa.

## Como testar

1. Abra `index.html`.
2. No primeiro slide do carrossel, clique em **AGENDAR ATENDIMENTO**.
3. Escolha “Para mim” ou “Para outra pessoa”.
4. Escolha Carteirinha ou CPF e clique em **Preencher com dados de exemplo**.
5. Conclua o fluxo.
6. Abra `painel.html` para ver o agendamento refletido na visão do gestor (no mesmo navegador).

## Publicação no GitHub Pages

Envie todos os arquivos e a pasta `assets` para a raiz do repositório. Em **Settings > Pages**, selecione a branch `main` e a pasta `/ (root)`.

## Importante

Protótipo demonstrativo. Não possui autenticação real, banco de dados, integração com a Unimed, validação de CPF/carteirinha nem armazenamento seguro de dados pessoais. Para produção seria necessário backend, autenticação, autorização, auditoria, LGPD, integrações, regras de negócio e infraestrutura adequada.
