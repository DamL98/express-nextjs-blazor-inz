using FrontendBlazor.Client.Infrastructure.Api;
using FrontendBlazor.Client.Infrastructure.Firebase;

namespace FrontendBlazor.Client.Features.Auth;

public sealed class AuthContext(
    FirebaseAuth firebaseAuth,
    ApiClient apiClient) : IDisposable
{
    private readonly SemaphoreSlim _initializationLock = new(1, 1);
    private bool _initialized;

    public event Action? Changed;

    public FirebaseUser? FirebaseUser { get; private set; }

    public LocalUser? User { get; private set; }

    public bool Loading { get; private set; } = true;

    public bool IsAuthenticated => User is not null;

    public string? InitializationError { get; private set; }

    public async Task InitializeAsync()
    {
        if (_initialized)
        {
            return;
        }

        await _initializationLock.WaitAsync();

        try
        {
            if (_initialized)
            {
                return;
            }

            InitializationError = null;
            FirebaseUser = await firebaseAuth.InitializeAsync();

            if (FirebaseUser is not null)
            {
                User = await SynchronizeUserAsync();
            }
        }
        catch (Exception exception)
        {
            User = null;
            InitializationError = exception.Message;
        }
        finally
        {
            _initialized = true;
            Loading = false;
            _initializationLock.Release();
            NotifyChanged();
        }
    }

    public async Task LoginAsync(string email, string password)
    {
        await SignInAsync(() => firebaseAuth.LoginAsync(email, password));
    }

    public async Task RegisterAsync(
        string fullName,
        string email,
        string password)
    {
        await SignInAsync(() => firebaseAuth.RegisterAsync(
            fullName,
            email,
            password));
    }

    public async Task LoginWithGoogleAsync()
    {
        await SignInAsync(firebaseAuth.LoginWithGoogleAsync);
    }

    public async Task LogoutAsync()
    {
        await firebaseAuth.LogoutAsync();
        FirebaseUser = null;
        User = null;
        InitializationError = null;
        NotifyChanged();
    }

    public Task<string> GetIdTokenAsync(bool forceRefresh = false)
    {
        return firebaseAuth.GetIdTokenAsync(forceRefresh);
    }

    public void Dispose()
    {
        _initializationLock.Dispose();
    }

    private async Task CompleteSignInAsync(FirebaseUser firebaseUser)
    {
        FirebaseUser = firebaseUser;
        User = null;
        InitializationError = null;
        NotifyChanged();

        try
        {
            User = await SynchronizeUserAsync(forceRefresh: true);
            NotifyChanged();
        }
        catch
        {
            NotifyChanged();
            throw;
        }
    }

    private async Task SignInAsync(Func<Task<FirebaseUser>> signIn)
    {
        var firebaseUser = await signIn();
        await CompleteSignInAsync(firebaseUser);
    }

    private async Task<LocalUser> SynchronizeUserAsync(
        bool forceRefresh = false)
    {
        var token = await firebaseAuth.GetIdTokenAsync(forceRefresh);

        return await apiClient.ApiRequestAsync<LocalUser>(
            "/auth/session",
            new ApiRequestOptions
            {
                Method = HttpMethod.Post,
                Token = token,
            });
    }

    private void NotifyChanged()
    {
        Changed?.Invoke();
    }
}
