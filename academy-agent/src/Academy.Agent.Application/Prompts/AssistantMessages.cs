namespace Academy.Agent.Application.Prompts;

public static class AssistantMessages
{
    public const string Greeting =
        "مرحباً بك في أكاديمية القرآن 🎓 كيف يمكنني مساعدتك؟\n\n" +
        "• سؤال في القرآن الكريم أو الحديث الشريف أو التجويد\n" +
        "• تفاصيل الاشتراك والباقات والأسعار\n" +
        "• التسجيل أو الحجز الآن";

    public const string OutOfScope =
        "هذا خارج نطاق خدمات الأكاديمية، يمكنني مساعدتك في القرآن/الحديث/التجويد أو معلومات الاشتراك.";

    public const string FatwaReferral =
        "للحكم الشرعي التفصيلي يُرجى الرجوع إلى عالم/جهة إفتاء معتمدة.";

    public const string CannotVerify =
        "لم أتمكن من التحقق من ذلك من مصادر موثوقة متاحة حاليًا.";
}
