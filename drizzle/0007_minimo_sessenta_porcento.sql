UPDATE `licitacao_items`
SET `valor_minimo` = ROUND(`custo_unitario` * 1.60, 2)
WHERE `custo_unitario` > 0
  AND (`valor_minimo` IS NULL OR `valor_minimo` < ROUND(`custo_unitario` * 1.60, 2));
