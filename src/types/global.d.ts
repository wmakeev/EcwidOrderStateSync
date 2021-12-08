declare module NodeJS {
  interface Global {
    // TODO Использовать Symbol?
    appConfig: {
      /**
       * Идентификатор пользовательского поля в заказе покупателя поля в котором
       * содержится id связанного заказа в Ecwid
       */
      ecwidOrderIdUserFieldName: string
    }
  }
}
