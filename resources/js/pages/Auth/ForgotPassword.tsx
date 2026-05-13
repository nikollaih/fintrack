import { useForm, Link } from '@inertiajs/react';
import GuestLayout from '@/layouts/GuestLayout';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';

interface Props {
    status?: string;
}

export default function ForgotPassword({ status }: Props) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <GuestLayout>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Recuperar contraseña</h2>
            <p className="text-sm text-gray-500 mb-6">
                Ingresa tu correo y te enviaremos un enlace de recuperación.
            </p>

            {status && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Correo electrónico"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    autoFocus
                    required
                />
                <Button type="submit" loading={processing} className="w-full justify-center">
                    Enviar enlace
                </Button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-500">
                <Link href="/login" className="text-primary-600 font-medium hover:underline">
                    Volver al inicio de sesión
                </Link>
            </p>
        </GuestLayout>
    );
}
