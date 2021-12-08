# EcwidOrderStateSync

> Синхронизация статуса заказа Ecwid в соответствии со статусом заказа в МойСклад

## Параметры приложения

Должны быть заполнены следующие параметры

### [SecretManager](https://eu-west-1.console.aws.amazon.com/secretsmanager/home?region=eu-west-1#!/listSecrets/)

- `[stage]/moysklad/auth` (json)

  ```ts
  {
    login: string
    password: string
  }
  ```

- `[stage]/ecwid/auth` (json)

  ```ts
  {
    storeId: string
    tokenSecret: string
  }
  ```

где `[stage]` - `prod` и `stage`

### [SSM Parameter Store](https://eu-west-1.console.aws.amazon.com/systems-manager/parameters/?region=eu-west-1&tab=Table)

- `[stage]/EcwidOrderStateSync/config` (без шифрования)

  ```ts
  {
    /**
     * Идентификатор пользовательского поля в заказе покупателя поля в котором
     * содержится id связанного заказа в Ecwid
     */
    "ecwidOrderIdUserFieldName": string
  }
  ```

где `[stage]` - `prod` и `stage`
