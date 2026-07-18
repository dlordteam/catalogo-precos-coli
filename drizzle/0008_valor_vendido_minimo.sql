UPDATE `licitacao_items`
SET `valor_vendido` = `valor_minimo`
WHERE `custo_unitario` > 0
  AND (`valor_vendido` IS NULL OR `valor_vendido` < `valor_minimo`);
