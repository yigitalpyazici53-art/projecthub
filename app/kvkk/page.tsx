import type { Metadata } from "next";
import { publicMetadata } from "@/utils/seo";
import { LegalDoc, Section, P, UL, A, Table } from "@/components/legal/LegalDoc";
import { CONTACT_EMAIL, CONTROLLER_LOCATION, CONTROLLER_NAME, POLICY_UPDATED_TR } from "@/utils/legal";

export const metadata: Metadata = publicMetadata({
  title: "KVKK Aydınlatma Metni",
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında ProjectHub kişisel veri işleme aydınlatma metni.",
  path: "/kvkk",
});

export default function KvkkPage() {
  return (
    <LegalDoc
      lang="tr"
      title="KVKK Aydınlatma Metni"
      updatedLabel="Son güncelleme"
      lead={
        <>
          Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu&apos;nun (&ldquo;KVKK&rdquo;) 10. maddesi ve
          Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ uyarınca,
          ProjectHub kullanıcılarını ve başvuru formunu dolduranları kişisel verilerinin işlenmesi hakkında
          bilgilendirmek için hazırlanmıştır. Ayrıntılı bilgi için <A href="/privacy">Gizlilik Politikası</A>&apos;na
          (İngilizce) bakabilirsiniz.
        </>
      }
      updated={POLICY_UPDATED_TR}
      seeAlso={[
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/cookies", label: "Cookie Policy" },
        { href: "/terms", label: "Terms of Service" },
      ]}
    >
      <Section title="1. Veri sorumlusu">
        <P>
          Veri sorumlusu: <strong>{CONTROLLER_NAME}</strong>, {CONTROLLER_LOCATION}.
          İletişim: <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A>
        </P>
        <P>ProjectHub yalnızca 18 yaş ve üzeri kişilere yöneliktir.</P>
      </Section>

      <Section title="2. İşlenen kişisel veriler">
        <UL>
          <li><strong>Kimlik ve iletişim:</strong> ad soyad, kullanıcı adı, e-posta adresi; Google ile giriş yapılırsa Google&apos;ın paylaştığı ad, e-posta ve hesap kimliği.</li>
          <li><strong>Profil:</strong> üniversite, rol, biyografi, yetenekler, uygunluk durumu, GitHub / LinkedIn / portfolyo bağlantıları, profil fotoğrafı.</li>
          <li><strong>Kullanıcı içeriği:</strong> projeler ve proje güncellemeleri, projelere başvurular ve başvuru mesajları, bağlantı istekleri, özel mesajlar, onaylar (endorsement).</li>
          <li><strong>İşlem güvenliği:</strong> şifre özeti (hash), giriş zamanları, oturum çerezleri, sunucu kayıtları (IP adresi, tarayıcı, istenen sayfa, zaman), şikâyet ve engelleme kayıtları, gönderilen bildirim e-postalarının kaydı.</li>
          <li><strong>Hukuki işlem:</strong> 18 yaşından büyük olduğunuza ve politikaları okuduğunuza ilişkin beyanınız, beyan zamanı ve politika sürümü.</li>
          <li><strong>Başvuru formu (/apply):</strong> ad soyad, e-posta, üniversite, rol, yetenekler, proje bilgileri, bağlantılar, katılım gerekçesi, değerlendirme notları ve karar.</li>
          <li><strong>Pazarlama/analitik (yalnızca açık rızanızla):</strong> Google Analytics çerezleri aracılığıyla ziyaret edilen sayfalar, yaklaşık konum, cihaz ve tarayıcı bilgisi.</li>
        </UL>
        <P>Doğum tarihi, telefon numarası, ödeme bilgisi veya özel nitelikli kişisel veri talep etmiyoruz; lütfen profilinizde ya da mesajlarınızda bu tür verilere yer vermeyin.</P>
      </Section>

      <Section title="3. İşleme amaçları ve hukuki sebepler (KVKK m. 5)">
        <Table
          head={["Amaç", "Hukuki sebep"]}
          rows={[
            ["Hesabın oluşturulması ve yönetimi; profil, proje, başvuru, bağlantı, mesajlaşma ve onay özelliklerinin sunulması; bildirim e-postalarının gönderilmesi", "Sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması (m. 5/2-c)"],
            ["Herkese açık profilin ve projelerin diğer kullanıcılara ve ziyaretçilere gösterilmesi", "Sözleşmenin ifası (m. 5/2-c); ilgili kişinin kendisi tarafından alenileştirilmesi (m. 5/2-d)"],
            ["Başvuru formunun değerlendirilmesi", "Sözleşmenin kurulmasıyla doğrudan ilgili olması (m. 5/2-c)"],
            ["Platform güvenliği, kötüye kullanımın önlenmesi, şikâyet ve engelleme süreçleri, sunucu ve e-posta kayıtları", "Veri sorumlusunun meşru menfaati (m. 5/2-f)"],
            ["18 yaş ve politika beyanlarının kaydı; hukuki taleplere yanıt verilmesi", "Bir hakkın tesisi, kullanılması veya korunması (m. 5/2-e); hukuki yükümlülük (m. 5/2-ç)"],
            ["Google Analytics ile site kullanımının ölçülmesi", "Açık rıza (m. 5/1); çerez banner'ı üzerinden verilir ve her zaman geri alınabilir"],
          ]}
        />
      </Section>

      <Section title="4. Kişisel verilerin aktarılması (KVKK m. 8 ve m. 9)">
        <P>Kişisel verileriniz, yukarıdaki amaçlarla sınırlı olarak aşağıdaki hizmet sağlayıcılarına (veri işleyen) aktarılır:</P>
        <Table
          head={["Alıcı", "Amaç", "Ülke"]}
          rows={[
            ["Supabase, Inc.", "Veritabanı, kimlik doğrulama, dosya depolama", "ABD merkezli şirket; veriler AB'de (İrlanda, AWS eu-west-1) saklanır"],
            ["Vercel, Inc.", "Web sitesi barındırma ve sunucu fonksiyonları", "ABD merkezli şirket; sunucu fonksiyonları Dublin, İrlanda'da çalışır; sayfalar küresel bir ağ üzerinden iletilir"],
            ["Resend, Inc.", "Tüm e-postaların gönderimi: giriş kodu ve bağlantısı, kayıt onayı, şifre sıfırlama, e-posta değişikliği ve bildirim e-postaları (e-posta adresiniz ve e-postanın içeriği işlenir). Gönderen adres: noreply@projecthubstudents.com", "ABD"],
            ["Google LLC / Google Ireland Ltd.", "Google Analytics (yalnızca açık rızayla) ve Google ile giriş (yalnızca kullanırsanız)", "ABD ve diğer ülkeler"],
          ]}
        />
        <P>
          Bu sağlayıcıları kullandığımız için kişisel verileriniz <strong>yurt dışına</strong> aktarılır:
          Supabase ve Vercel için İrlanda&apos;ya (AB), Resend ve Google için ABD&apos;ye. Supabase ve Vercel ABD
          merkezli şirketler olduğundan, verilere ABD&apos;den erişilmesi de mümkündür. Hangi sağlayıcıya hangi
          verinin hangi amaçla aktarıldığı yukarıdaki tabloda yer alır.
        </P>
        <P>
          Yurt dışına aktarım KVKK m.9 kapsamında yapılır. Google Analytics için aktarım açık rızanıza dayanır
          (m.9/6-a). Diğer aktarımlar, istediğiniz hizmetin sunulması, yani sözleşmenin ifası için zorunludur
          (m.9/6-b). Bu istisna arızi, yani düzenli ve tekrarlı olmayan aktarımlar için öngörülmüştür. Süreklilik
          arz eden aktarımlar için KVKK, standart sözleşme imzalanmasını ve sözleşmenin Kurul&apos;a bildirilmesini
          öngörür (m.9/4-b ve m.9/5). Bu sağlayıcılarla henüz KVKK standart sözleşmesi imzalanmamış ve Kurul&apos;a bildirim
          yapılmamıştır. Bu adımlar tamamlandığında metin güncellenecektir.
        </P>
        <P>
          Supabase, Vercel ve Resend&apos;in hizmet koşullarının parçası olan veri işleme sözleşmeleri (DPA), Avrupa
          Komisyonu&apos;nun Standart Sözleşme Hükümlerini (2021/914) içerir. Bunlar sağlayıcıların AB hukukuna
          göre sunduğu güvencelerdir. KVKK standart sözleşmesi yerine geçmez.
        </P>
        <P>
          Herkese açık profil bilgileriniz diğer kullanıcılar ve ziyaretçiler tarafından görüntülenebilir
          (profilinizi gizleyebilirsiniz). Kanunen yetkili kamu kurum ve kuruluşlarına, talep halinde ve
          mevzuatın gerektirdiği ölçüde aktarım yapılabilir.
        </P>
      </Section>

      <Section title="5. Toplama yöntemi">
        <P>
          Kişisel verileriniz; kayıt, profil, proje, başvuru ve mesaj formları ile Google ile giriş aracılığıyla
          sizden, hizmetin kullanımı sırasında otomatik olarak (oturum çerezleri, sunucu ve e-posta kayıtları) ve
          açık rızanız varsa analitik çerezler aracılığıyla, elektronik ortamda toplanır.
        </P>
      </Section>

      <Section title="6. Saklama süreleri">
        <UL>
          <li>Hesap, profil, proje, mesaj, bağlantı, başvuru, onay ve ayar verileri: hesabınızı silene kadar.</li>
          <li>Bildirim e-postası kayıtları: 90 gün.</li>
          <li>Başvuru formu (/apply): karar verildikten sonra 12 ay.</li>
          <li>Şikâyet kayıtları: 12 ay.</li>
          <li>Sunucu kayıtları ve yedekler: barındırma sağlayıcılarının belirlediği sınırlı süreler.</li>
        </UL>
        <P>Süreler dolduğunda veriler otomatik olarak silinir. Hesabınızı profil ayarlarından kendiniz silebilirsiniz.</P>
      </Section>

      <Section title="7. Haklarınız (KVKK m. 11)">
        <P>Veri sorumlusuna başvurarak:</P>
        <UL>
          <li>kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
          <li>işlenmişse buna ilişkin bilgi talep etme,</li>
          <li>işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
          <li>yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
          <li>eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
          <li>KVKK m. 7&apos;deki şartlar çerçevesinde silinmesini veya yok edilmesini isteme,</li>
          <li>düzeltme, silme ve yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
          <li>münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
          <li>kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
        </UL>
        <P>haklarına sahipsiniz. Verilerinizin bir kopyasını da talep edebilirsiniz.</P>
      </Section>

      <Section title="8. Başvuru yolu">
        <P>
          Taleplerinizi, hesabınızda kayıtlı e-posta adresinden <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A>{" "}
          adresine yazılı olarak iletebilirsiniz. Başvurunuz, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında
          Tebliğ uyarınca en geç 30 gün içinde ücretsiz olarak sonuçlandırılır. Başvurunuzun reddedilmesi, verilen
          cevabı yetersiz bulmanız veya süresinde cevap verilmemesi hâlinde Kişisel Verileri Koruma Kurulu&apos;na
          şikâyette bulunabilirsiniz.
        </P>
      </Section>
    </LegalDoc>
  );
}
