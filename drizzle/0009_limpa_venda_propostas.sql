UPDATE `licitacao_items`
SET `valor_vendido` = 0
WHERE `licitacao_id` IN (
  SELECT `id` FROM `licitacoes` WHERE `status` = 'Proposta Enviada'
);
